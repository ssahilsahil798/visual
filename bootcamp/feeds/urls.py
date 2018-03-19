from django.conf.urls import url
from django.views.generic import TemplateView
from bootcamp.feeds import views

urlpatterns = [
    url(r'^$', views.feeds, name='feeds'),
    url(r'^createpost/$', views.create_post, name='create_post'),
    url(r'^post/$', views.post, name='post'),
    url(r'^like/$', views.like, name='like'),
    url(r'^comment/$', views.comment, name='comment'),
    url(r'^load/$', views.load, name='load'),
    url(r'^check/$', views.check, name='check'),
    url(r'^load_new/$', views.load_new, name='load_new'),
    url(r'^update/$', views.update, name='update'),
    url(r'^track_comments/$', views.track_comments, name='track_comments'),
    url(r'^remove/$', views.remove, name='remove_feed'),
    url(r'^(\d+)/$', views.feed, name='feed'),
    url(r'^upload/$', TemplateView.as_view(template_name='upload.html'), name='upload-home'),
]
