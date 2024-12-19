from django.shortcuts import render
from .models import Note, Box
from django.http import HttpResponse,Http404, JsonResponse
import random

# Create your views here.
#テスト用
def test(request, note_id):
    if request.method == "POST":
        data = request.POST
    try:
        initialPageObjects = Box.objects.get(parent_id=note_id)
        initialPageObjects = [ box.json() for box in initialPageObjects ]
    except: Box.DoesNotExist:
        raise Http404("Article does not exist")
    
    context = {
        pageBoxes: pageBoxes
    }
    return render(request, 'note/note.html', context)

def make_id(ref=[]):
    return random.random()

#HTTPメソッドにはPOST, GETのほかに PUTとDELETEもあるので、別でURLを用意しなくても分けられる
#PUTは２重で実行されないため、何かのミスで２回送信されて同じものが二つ作られたりするのを防げる
def box_api_handler(request, note_id, box_id):
    if request.method == "GET":
        box = Box.objects.get(pk = box_id)
        return JsonResponse(box.json())
    elif request.method == "POST":
        box = Box.objects.get(pk = box_id)
        data = request.POST
        for key in data["update_keys"]:
            box[key] = data["update_values"]
        box.save()
    elif request.method == "PUT":
        data = request.PUT
        range = data["range"]
        box = Box(x=range["x"], y=range["y"], width=range["width"], height=range["height"],
                    value=data["value"],id=make_id(ref=[]), type=data["type"], parent_id=note_id)
        box.save()
    elif request.method == "DELETE":
        box = Box.objects.get(pk = note_id)
        box.delete()

def note_api_handler(request, note_id):
    if request.method == "GET":
        note = Note.objects.get(pk = note_id)
        noteData = note.json()
        childrenData = Box.objects.get(parent_id = note_id)
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