import os
import json

from PIL import Image
from django.http import (HttpResponse, HttpResponseBadRequest,
                         HttpResponseForbidden)

from django.conf import settings as django_settings
from django.contrib import messages
from django.db.models import Q
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.paginator import EmptyPage, PageNotAnInteger, Paginator
from django.shortcuts import get_object_or_404, redirect, render

from bootcamp.core.forms import ChangePasswordForm, ProfileForm
from bootcamp.feeds.views import FEEDS_NUM_PAGES, feeds
from bootcamp.feeds.models import Feed
from bootcamp.decorators import ajax_required
from bootcamp.authentication.models import Profile
from django.core.files.storage import default_storage as storage
from django.core.files.base import ContentFile
import storages.backends.s3boto3

protected_storage = storages.backends.s3boto3.S3Boto3Storage(
  acl='private',
  querystring_auth=True,
  querystring_expire=600, # 10 minutes, try to ensure people won't/can't share
)

def home(request):
    if request.user.is_authenticated():
        return feeds(request)
    else:
        return render(request, 'core/cover.html')


@login_required
def network(request):
    users_list = User.objects.filter(is_active=True).order_by('username')
    paginator = Paginator(users_list, 100)
    page = request.GET.get('page')
    try:
        users = paginator.page(page)

    except PageNotAnInteger:
        users = paginator.page(1)

    except EmptyPage:  # pragma: no cover
        users = paginator.page(paginator.num_pages)

    return render(request, 'core/network.html', {'users': users})


@login_required
def profile(request, username):
    user = request.user.username
    page_user = get_object_or_404(User, username=username)
    all_feeds = Feed.get_feeds().filter(user=page_user)
    paginator = Paginator(all_feeds, FEEDS_NUM_PAGES)
    feeds = paginator.page(1)
    from_feed = -1
    if feeds:  # pragma: no cover
        from_feed = feeds[0].id

    feeds_count = Feed.objects.filter(user=page_user).count()

  

    #friendship = Friendship.objects.filter(from_user=page_user)
    
    friendship = "No friends added yet"
    data = {
        'page_user': page_user,
        # 'feeds_count': feeds_count,
        # 'article_count': article_count,
        # 'article_comment_count': article_comment_count,
        # 'question_count': question_count,
        # 'global_interactions': activity_count + article_comment_count + answer_count + messages_count,  # noqa: E501
        # 'answer_count': answer_count,
        # 'bar_data': [
        #     feeds_count, article_count, article_comment_count, question_count,
        #     answer_count, activity_count],
        # 'bar_labels': json.dumps('["Feeds", "Articles", "Comments", "Questions", "Answers", "Activities"]'),  # noqa: E501
        # 'line_labels': datepoints,
        # 'line_data': data,
        # 'feeds': feeds,
        # 'from_feed': from_feed,
        # 'page': 1,
        # 'friendship': friendship,

        }
    return render(request, 'core/profile.html', data)


# @login_required
# @ajax_required
# def friendrequest(request, username):
#     from_user = request.user
#     action = request.POST.get('action')
#     print "check.sfsldfsldkfjsldkfjsldkfjslk"
#     friendship = Friendship.objects.filter(to_user=request.user, from_user=User.objects.get(username=username))
#     if friendship.count() == 0:
#         friendship = Friendship.objects.filter(from_user=request.user, to_user=User.objects.get(username=username))
#         print friendship.count()
#         if friendship.count() == 0:

#                 if(username != request.user):
#                     print "adding friendship"

#                     to_user = User.objects.get(username=username)
#                     print username

#                     frnd = Friendship.objects.create(from_user=request.user, to_user=to_user, accepted=False)
#                     frnd.save()
#                     frnd.group_notification("frndrequest")
#                     friendship = Friendship.objects.filter(from_user=request.user, to_user=to_user)
#         else:
#             #frienship request exist
#             #if friend request is sent by request.user then delete friendship
            
#             if friendship[0].from_user == request.user:
#                 frnd = friendship[0]
#                 frnd.delete()
#                 frnd = None
                

#             #if friend request is sent by username then accept friendship if not accepted 
#             #if friend request is accepted then delete friendship
#             else:
#                 if friendship[0].accepted == True:
#                     frnd = friendship[0]
#                     frnd.delete()
#                     print "reaching 1 st"
#                     frnd = None
                
#                 else:
#                     print request.action
#                     if action == "accept":
#                         print "reached right statement"
#                         frnd = friendship[0]
#                         frnd.accepted = True
#                         frnd.save()
#                     else:
#                         print "reached wrong statement"
#                         frnd = friendship[0]
#                         frnd.delete()
#                         frnd = None


#     else:
#         #if friend request is sent by username then accept friendship if not accepted 
#         #if friend request is accepted then delete friendship
        
#         if friendship[0].from_user == request.user:
#             frnd = friendship[0]
#             frnd.delete()
#             print "reahed out else before 1 st"
#             frnd = None
            

#         else:
#             if friendship[0].accepted == True:
#                     frnd = friendship[0]
#                     print "reached outer else 1st"
#                     frnd.delete()
#                     frnd = None

            

#             else:
#                 if action == "accept":

#                     frnd = friendship[0]
#                     frnd.accepted = True
#                     print "reached outer else 2 nd"
#                     frnd.save()
#                 else:
#                     frnd = friendship[0]
#                     frnd.delete()
#                     frnd = None
#                     print action
#                     print "reached outer else 3rd"


#         #if friend request is sent by username then delete friendship


#     if friendship.count() != 0:
#         print friendship[0].from_user.username + "  to_user - " + friendship[0].to_user.username
#         button =""
#         button2 = ""
#         if(frnd.from_user == request.user and frnd.accepted == False):
#             button = "Cancel Request"
#         elif frnd.accepted == True and frnd.from_user == request.user:
#             button = "Remove Friend"
#         elif frnd.accepted == True and frnd.from_user != request.user:
#             button = "Remove Friend"
#         elif frnd.accepted == False and frnd.from_user != request.user:
#             button = "Add Friend"
#             button2 = "Ignore"
#         data = {
#             'from_user': str(frnd.from_user.username),
#             'to_user': frnd.to_user.username,
#             'accepted': frnd.accepted,
#             'button': button,
#             'button2': button2
#             }
#         print data
#     else:
#         data = {
#             'button': "Add Friend",
#             }

#     json_data = json.dumps(data)

#     return HttpResponse(json_data)

# @login_required
# @ajax_required
# def frndstatus(request, username):
#     user = request.user
#     print "reached frndstatus views.py"
#     profileuser = User.objects.get(username=username)
#     frndship = Friendship.objects.filter(to_user = user, from_user=profileuser)
#     if frndship.count()==0:
#         frndship = Friendship.objects.filter(to_user = profileuser, from_user=user)
#         print frndship
#     if frndship.count() == 0:
#         data = {"button":"Add Friend"}
#         print "empty set"
#         print frndship
#     else:
#         if frndship[0].accepted == True and frndship[0].from_user.username == user.username:
#             data = {"button": "Remove Friend"}
#             print "1 st"

#         elif frndship[0].accepted == True and frndship[0].from_user.username == username:
#             data = {"button": "Remove Friend"}
#             print "2nd "

#         elif frndship[0].accepted == False and frndship[0].from_user.username == user.username:
#             data = {"button": "Cancel Request"}
#             print "3 rd "
#         else:
#             data = {"button":"Add Friend", "button2": "Ignore"}
#             print "else 4 th"
            

#     json_data = json.dumps(data)

#     return HttpResponse(json_data)



@login_required
def settings(request):
    user = request.user
    if request.method == 'POST':
        form = ProfileForm(request.POST)
        if form.is_valid():
            user.first_name = form.cleaned_data.get('first_name')
            user.last_name = form.cleaned_data.get('last_name')
            user.profile.job_title = form.cleaned_data.get('job_title')
            user.email = form.cleaned_data.get('email')
            user.profile.url = form.cleaned_data.get('url')
            user.profile.location = form.cleaned_data.get('location')
            user.save()
            messages.add_message(request,
                                 messages.SUCCESS,
                                 'Your profile was successfully edited.')

    else:
        form = ProfileForm(instance=user, initial={
            'job_title': user.profile.job_title,
            'url': user.profile.url,
            'location': user.profile.location
            })

    return render(request, 'core/settings.html', {'form': form})


@login_required
def picture(request):
    uploaded_picture = False
    try:
        if request.GET.get('upload_picture') == 'uploaded':
            uploaded_picture = True

    except Exception:  # pragma: no cover
        pass

    return render(request, 'core/picture.html',
                  {'uploaded_picture': uploaded_picture})


@login_required
def password(request):
    user = request.user
    if request.method == 'POST':
        form = ChangePasswordForm(request.POST)
        if form.is_valid():
            new_password = form.cleaned_data.get('new_password')
            user.set_password(new_password)
            user.save()
            update_session_auth_hash(request, user)
            messages.add_message(request, messages.SUCCESS,
                                 'Your password was successfully changed.')
            return redirect('password')

    else:
        form = ChangePasswordForm(instance=user)

    return render(request, 'core/password.html', {'form': form})


@login_required
def upload_picture(request):
    try:
        profile_pictures = django_settings.MEDIA_ROOT + '/profile_pictures/'
        if not os.path.exists(profile_pictures):
            os.makedirs(profile_pictures)

        f = request.FILES['picture']
        filename = profile_pictures + request.user.username + '_tmp.jpg'
        with open(filename, 'wb+') as destination:
            for chunk in f.chunks():
                destination.write(chunk)

        im = Image.open(filename)
        width, height = im.size
        if width > 350:
            new_width = 350
            new_height = (height * 350) / width
            new_size = new_width, new_height
            im.thumbnail(new_size, Image.ANTIALIAS)
            im.save(filename)

        return redirect('/settings/picture/?upload_picture=uploaded')

    except Exception:
        return redirect('/settings/picture/')

        
@login_required
def save_uploaded_picture(request):
    try:
        x = int(request.POST.get('x'))
        y = int(request.POST.get('y'))
        w = int(request.POST.get('w'))
        h = int(request.POST.get('h'))
        tmp_filename = django_settings.MEDIA_ROOT + '/profile_pictures/' +\
            request.user.username + '_tmp.jpg'
        filename = django_settings.MEDIA_ROOT + '/profile_pictures/' +\
            request.user.username + '.jpg'
        im = Image.open(tmp_filename)
        cropped_im = im.crop((x, y, w+x, h+y))
        cropped_im.thumbnail((200, 200), Image.ANTIALIAS)
        cropped_im.save(filename)
        os.remove(tmp_filename)

    except Exception:
        pass

    return redirect('/settings/picture/')
