from django.shortcuts import render, redirect
from .models import Note, Box, ShortURL
from django.http import HttpResponse, Http404, JsonResponse, QueryDict
from . import my_utils
from .constants import API_RESPONSES, SYSTEM_API_PATH_SEGMENT

import json


# Create your views here.
#テスト用
def test(request, note_id):
    #data = json.loads(request.body)
    note = Note(id=my_utils.make_id(ref=[]))
    short_url = ShortURL(target=note.id,path=my_utils.make_id(ref=[]))
    note.name = note_id
    note.save()
    short_url.save()    
    return HttpResponse(f"id:{note.id}, name:{note.name} でテスト用ノートを作りました\n"+
                        F"shareURL: {short_url.pk}")


#HTTPメソッドにはPOST, GETのほかに PUTとDELETEもあるので、別でURLを用意しなくても分けられる
#PUTは２重で実行されないため、何かのミスで２回送信されて同じものが二つ作られたりするのを防げる

def note_api_handler(request, note_id):
    print("noteAPI",note_id)
    if request.method == "GET":
        note = Note.objects.get(pk = note_id)
        noteData = note.json()
        childrenData = Box.objects.filter(parent_id = note_id)
        noteData["children"] = [ child.json() for child in childrenData ]
        return JsonResponse(noteData)
    elif request.method == "POST":
        note = Note.objects.get(pk = note_id)    
        data = json.loads(request.body)
        
        for i, key in enumerate(data["update_keys"]):
            setattr(note, key, data["update_values"][i])
        note.save()
    elif request.method == "PUT":
        data = json.loads(request.body)
        note = Note(id=my_utils.make_id(ref=[]))
        short_url = ShortURL(target=note.id,path=my_utils.make_id(ref=[]))
        if data["name"]: note.name = data["name"]
        note.save()
        short_url.save()
        return HttpResponse(note.id)
    elif request.method == "DELETE":
        note = Note.objects.get(pk = note_id)

def new_note(request):
    return render(request, 'note/new_note.html')

def be_made_note(request):
    return render(request, 'note/be_made_note.html')

def editor(request, note_id):
    try:
        note = Note.objects.get(pk = note_id)
    except Note.DoesNotExist: 
        raise Http404("404")
    
    initialPageObjects = []
    try:
        initialPageObjects = Box.objects.filter(parent_id=note_id)
        initialPageObjects = [ box.json() for box in initialPageObjects ]
    except Box.DoesNotExist:
        print( Http404("Article does not exist"))

    context = {
        "SYSTEM_API_PATH_SEGMENT": SYSTEM_API_PATH_SEGMENT,
        "note": { 
            "name": note.name,
            "posted_at": note.created_at,
            "updated_at": note.updated_at,
            "id": note.id,
            "editor": {
               "initialPageObjects": initialPageObjects 
            }
        }
    }
    return render(request, 'note/editor.html', context)

def home(request):
    return render(request, 'note/home.html')