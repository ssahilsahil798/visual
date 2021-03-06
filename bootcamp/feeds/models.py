from __future__ import unicode_literals

import json

from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.utils.encoding import python_2_unicode_compatible
from django.utils.html import escape
from django.utils.translation import ugettext_lazy as _

import bleach

from channels import Group



@python_2_unicode_compatible
class Feed(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)
    post = models.TextField(max_length=255)
    parent = models.ForeignKey(
        'Feed', null=True, blank=True, on_delete=models.SET_NULL)
    likes = models.IntegerField(default=0)
    comments = models.IntegerField(default=0)
    url = models.TextField(max_length=255, blank=True, null =True)

    class Meta:
        verbose_name = _('Feed')
        verbose_name_plural = _('Feeds')
        ordering = ('-date',)

    def __str__(self):
        return self.post

    @staticmethod
    def get_feeds(from_feed=None):
        if from_feed is not None:
            feeds = Feed.objects.filter(parent=None, id__lte=from_feed)
            for item in feeds:
                if item.feed_media.all().count() != 0:
                    item.url = item.feed_media.all()[0].path
                    item.save()
                    print item.url
        else:
            feeds = Feed.objects.filter(parent=None)

        return feeds

    @staticmethod
    def get_feeds_after(feed):
        feeds = Feed.objects.filter(parent=None, id__gt=feed)
        return feeds

    def get_comments(self):
        return Feed.objects.filter(parent=self).order_by('date')

    def calculate_likes(self):
        likes = Activity.objects.filter(activity_type=Activity.LIKE,
                                        feed=self.pk).count()
        self.likes = likes
        self.save()
        return self.likes

    # def get_likes(self):
    #     likes = Activity.objects.filter(activity_type=Activity.LIKE,
    #                                     feed=self.pk)
        return likes

    # def get_likers(self):
    #     likes = self.get_likes()
    #     likers = []
    #     for like in likes:
    #         likers.append(like.user)

    #     return likers

    def calculate_comments(self):
        self.comments = Feed.objects.filter(parent=self).count()
        self.save()
        return self.comments

    def comment(self, user, post):
        feed_comment = Feed(user=user, post=post, parent=self)
        feed_comment.save()
        self.comments = Feed.objects.filter(parent=self).count()
        self.save()
        return feed_comment

    def linkfy_post(self):
        return bleach.linkify(escape(self.post))

    def feed_log(self, activity):
        pass
        # Group('feeds').send({
        #     'text': json.dumps({
        #         'username': self.user.username,
        #         'activity': activity,
        #     })
        # })


def new_feed_added(sender, instance, created, **kwargs):
    if created:
        if instance.parent == None or instance.parent == "":
            instance.feed_log('new_feed')

post_save.connect(new_feed_added, sender=Feed)
