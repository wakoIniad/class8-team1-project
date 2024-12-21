from django.db import models
from django.utils import timezone
from . import my_utils

# Create your models here.

class Box(models.Model):
    updated_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)
    x = models.FloatField()
    y = models.FloatField()
    width = models.FloatField()
    height = models.FloatField()
    value = models.TextField(default="") #でかすぎるファイルを入れられたら大変なので、max_lengthを設定してもいいかも（数千から数万じゃないと普通のファイルも入らない）
    type = models.TextField()
    id = models.TextField(primary_key=True)
    parent_id = models.TextField()

    def updateTime(self):
        self.published_at = timezone.now()
        self.save()

    def json(self):
        return {
            "range": {
                "x": self.x, "y": self.y, "width": self.width, "height": self.height
            },
            "id": self.id, "value": self.value, "type": self.type
        }

class Note(models.Model):
    id = models.TextField(primary_key=True)
    updated_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)
    dumped = models.BooleanField(default=False)
    name = models.CharField(max_length=128, default="untitled")

    
    def updateTime(self):
        self.published_at = timezone.now()
        self.save()

    def json(self):
        return {
            "id": self.id,
            "updated_at": self.updated_at,
            "created_at": self.created_at,
            "dumped": self.dumped,
            "name": self.name,
        }

class ShortURL(models.Model):
    id = models.CharField(max_length=32, primary_key=True)
    updated_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)
    dumped = models.BooleanField(default=False)
    target = models.CharField(max_length=16)

    def json(self):
        return {
            "id": self.id,
            "updated_at": self.updated_at,
            "created_at": self.created_at,
            "target": self.target,
            "dumped": self.dumped,
        }