from django.shortcuts import render
from .models import Note, Box
from django.http import HttpResponse, Http404, JsonResponse, QueryDict
import random

import json


# Create your views here.
#テスト用
def test(request, note_id):
    print(note_id)
    initialPageObjects = []
    try:
        initialPageObjects = Box.objects.filter(parent_id=note_id)
        initialPageObjects = [ box.json() for box in initialPageObjects ]
    except Box.DoesNotExist:
        print( Http404("Article does not exist"))
    print(initialPageObjects)
    context = {
        "initialPageObjects": initialPageObjects
    }
    return render(request, 'note/note.html', 
                  #context
                  )

def make_id(ref=[]):
    return random.randint(0,100000000)

#HTTPメソッドにはPOST, GETのほかに PUTとDELETEもあるので、別でURLを用意しなくても分けられる
#PUTは２重で実行されないため、何かのミスで２回送信されて同じものが二つ作られたりするのを防げる
def box_api_handler(request, note_id, box_id):
    print("BoxAPI",note_id,request.method)
    if request.method == "GET":
        try:
            box = Box.objects.get(pk = box_id)
            return JsonResponse(box.json())
        except: 
            print("ERROR")
    elif request.method == "POST":
        print(box_id)
        try:
            box = Box.objects.get(pk = box_id)    
            data = json.loads(request.body)
            print(data)
            for i, key in enumerate(data["update_keys"]):
                setattr(box, key, data["update_values"][i])
            box.save()
            return HttpResponse("OK",status=200)
        except Box.DoesNotExist:
            print('Boxが存在しない')
            return HttpResponse("Boxが存在しない",status=500)
        except Exception as e:
            print('予期しないエラー',e)
            return HttpResponse("予期しないエラー",status=500)
    elif request.method == "PUT":
        data = json.loads(request.body)
        print(note_id)
        range = data["range"]
        box = Box(x=range["x"], y=range["y"], width=range["width"], height=range["height"],
                    id=make_id(ref=[]), type=data["type"], parent_id=note_id)
        box.save()
        return HttpResponse(box.id)
    elif request.method == "DELETE":
        box = Box.objects.get(pk = note_id)
        box.delete()

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
        data = request.POST
        for key in data["update_keys"]:
            note[key] = data["update_values"]
        note.save()
    elif request.method == "PUT":
        note = Note(id=make_id(ref=[]))
        note.save()
        return HttpResponse(note.id)
    elif request.method == "DELETE":
        note = Note.objects.get(pk = note_id)

def new_note(request):
    return render(request, 'note/new_note.html')

def be_made_note(request):
    return render(request, 'note/be_made_note.html')

def note(request, note_id):
    context = { #テストデータ
        "note": [
            { "title": "",
              "posted_at": "",
              },
            { "title": "",
              "posted_at": "",
              },

        ]
    }
    return render(request, 'note/note.html')

def home(request):
    return render(request, 'note/home.html')