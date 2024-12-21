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
def test(request, note_id):
    #data = json.loads(request.body)
    return render(request, 'note/make_note_test.html')
def new_note(request):
    return render(request, 'note/new_note.html')

def note_list(request):
    return render(request, 'note/note_list.html')

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

def home(request):
    return render(request, 'note/home.html')