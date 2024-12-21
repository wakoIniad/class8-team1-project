from django.shortcuts import render, redirect
from .models import Note, Box, ShortURL
from django.http import HttpResponse, Http404, JsonResponse, QueryDict
from . import my_lib
import random

import json


# Create your views here.
#テスト用
def test(request, note_id):
    data = json.loads(request.body)
    note = Note(id=my_lib.make_id(ref=[]))
    short_url = ShortURL(target=note.id,path=my_lib.make_id(ref=[]))
    if data["name"]: note.name = note_id
    note.save()
    short_url.save()    


#HTTPメソッドにはPOST, GETのほかに PUTとDELETEもあるので、別でURLを用意しなくても分けられる
#PUTは２重で実行されないため、何かのミスで２回送信されて同じものが二つ作られたりするのを防げる
def box_api_handler(request, note_id, box_id):
    print("BoxAPI",note_id,'/',box_id,request.method)
    if request.method == "GET":
        try:
            box = Box.objects.get(pk = box_id)
            return JsonResponse(box.json())
        except Box.DoesNotExist:
            print('Boxが存在しない')
            return HttpResponse("BoxDoesNotExist",status=500)
        except Exception as e:
            print('予期しないエラー',e)
            return HttpResponse("予期しないエラー",status=500)
    elif request.method == "POST":
        try:
            box = Box.objects.get(pk = box_id)    
            data = json.loads(request.body)
            for i, key in enumerate(data["update_keys"]):
                setattr(box, key, data["update_values"][i])
            box.save()
            return HttpResponse(status=200)
        except Box.DoesNotExist:
            print('Boxが存在しない')
            return HttpResponse("BoxDoesNotExist",status=500)
        except Exception as e:
            print('予期しないエラー',e)
            return HttpResponse("予期しないエラー",status=500)
    elif request.method == "PUT":
        data = json.loads(request.body)
        print(note_id)
        range = data["range"]
        box = Box(x=range["x"], y=range["y"], width=range["width"], height=range["height"],
                    id=my_lib.make_id(ref=[]), type=data["type"], parent_id=note_id)
        box.save()
        return HttpResponse(box.id)
    elif request.method == "DELETE":
        box = Box.objects.get(pk = box_id)
        box.delete()
        return HttpResponse(status=200)

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
        note = Note(id=my_lib.make_id(ref=[]))
        short_url = ShortURL(target=note.id,path=my_lib.make_id(ref=[]))
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

def shortURL_redirect(request, short_url):
    try:
        short_url = ShortURL.objects.get(pk=short_url)
        return redirect(f"{short_url.target}/editor")
    except ShortURL.DoesNotExist:
        return Http404()

def editor(request, note_id):
    try:
        note = Note.objects.get(pk = note_id)
    except Note.DoesNotExist: 
        return Http404()
    
    initialPageObjects = []
    try:
        initialPageObjects = Box.objects.filter(parent_id=note_id)
        initialPageObjects = [ box.json() for box in initialPageObjects ]
    except Box.DoesNotExist:
        print( Http404("Article does not exist"))

    context = {
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