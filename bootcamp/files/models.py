# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.conf import settings
from bootcamp.feeds.models import Feed
# Create your models here.
class FileItem(models.Model):
    feed                            = models.ForeignKey(Feed, related_name="feed_media", default=1)
    name                            = models.CharField(max_length=120, null=True, blank=True)
    path                            = models.TextField(blank=True, null=True)
    size                            = models.BigIntegerField(default=0)
    file_type                       = models.CharField(max_length=120, null=True, blank=True)
    timestamp                       = models.DateTimeField(auto_now_add=True)
    updated                         = models.DateTimeField(auto_now=True)
    uploaded                        = models.BooleanField(default=False)
    active                          = models.BooleanField(default=True)

    @property
    def title(self):
        return str(self.name)