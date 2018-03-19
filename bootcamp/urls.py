from django.conf import settings
from django.conf.urls import include, url
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views


from bootcamp.authentication import views as bootcamp_auth_views
from bootcamp.core import views as core_views
from bootcamp.search import views as search_views
from django.conf.urls import url
from bootcamp.files.views import FilePolicyAPI, FileUploadCompleteHandler

urlpatterns = [
    url(r'^$', core_views.home, name='home'),
    url(r'^login', auth_views.login, {'template_name': 'core/cover.html'},
        name='login'),
    url(r'^logout', auth_views.logout, {'next_page': '/'}, name='logout'),
    url(r'^signup/$', bootcamp_auth_views.signup, name='signup'),
    url(r'^settings/$', core_views.settings, name='settings'),
    url(r'^settings/picture/$', core_views.picture, name='picture'),
    url(r'^settings/upload_picture/$', core_views.upload_picture,
        name='upload_picture'),
    url(r'^settings/save_uploaded_picture/$', core_views.save_uploaded_picture,
        name='save_uploaded_picture'),
    url(r'^settings/password/$', core_views.password, name='password'),
    url(r'^feeds/', include('bootcamp.feeds.urls')),
    # For autocomplete suggestions
    url(r'^autocomplete/$',
        search_views.get_autocomplete_suggestions, name='autocomplete'),
    url(r'^search/$', search_views.search, name='search'),
    url(r'^(?P<username>[^/]+)/$', core_views.profile, name='profile'),
    url(r'^i18n/', include('django.conf.urls.i18n', namespace='i18n')),
    url(r'^api/files/policy/$', FilePolicyAPI.as_view(), name='upload-policy'),
    url(r'^api/files/complete/$', FilePolicyAPI.as_view(), name='upload-complete'),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
