from django.views.decorators.cache import never_cache
from django.shortcuts import render, redirect
from .models import Note, Box, ShortURL
from .default_api_handler import DefaultApiHandler
from django.http import HttpResponse, Http404, JsonResponse, QueryDict
from . import my_utils
from .constants import API_RESPONSES, SYSTEM_API_PATH_SEGMENT

import json
import requests


# Create your views here.
#テスト用

@never_cache
def test(request):
    #新しいノートを作成するテスト
    return render(request, 'note/test.html')

@never_cache
def note_list(request):
    context = {
        'title': '過去ノート一覧'
    }
    return render(request, 'note/note_list.html', context)

@never_cache
def editor(request, note_id):
    try:
        note = Note.objects.get(pk = note_id)
    except Note.DoesNotExist: 
        raise Http404("404")
    
    context = {
        "SYSTEM_API_PATH_SEGMENT": SYSTEM_API_PATH_SEGMENT,
        "note": { 
            "name": note.name,
            "posted_at": note.created_at,
            "updated_at": note.updated_at,
            "id": note.id,
            "editor": {
            }
        }
    }
    
    return render(request, 'note/editor.html', context)

@never_cache
def home(request):
    context = {
        'title': 'ホーム画面'
    }
    return render(request, 'note/home.html', context)