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
    url = f"{my_utils.get_top_page_url(request)}/api/note/{SYSTEM_API_PATH_SEGMENT}/"
    print(url)
    data = {
        'name': note_id
    }
    result = DefaultApiHandler.callAPI(
        request, method='PUT', 
        url=SYSTEM_API_PATH_SEGMENT+'/', 
        data=data 
    )
    
    print('test(){}', result)
    #result = result.json()
    return HttpResponse(f"{result}") #HttpResponse(f"id:{result.id}, name:{data.name} でテスト用ノートを作りました\n"+
                  #      F"shareURL: {result.short_url}")

def new_note(request):
    return render(request, 'note/new_note.html')

def be_made_note(request):
    return render(request, 'note/be_made_note.html')

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