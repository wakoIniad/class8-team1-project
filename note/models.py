from django.db import models
from django.utils import timezone

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
    name = models.CharField(max_length=128, default="untitled")
    id = models.TextField(primary_key=True)
    updated_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)
    
    def updateTime(self):
        self.published_at = timezone.now()
        self.save()

    def json(self):
        return {
            "id": self.id
        }

class ShortURL(models.Model):
    target = models.CharField(max_length=16)
    path = models.CharField(max_length=32, primary_key=True)
    dumped = models.BooleanField(default=False)