from django.shortcuts import render
from .models import Note, Box
from django.http import HttpResponse,Http404, JsonResponse

# Create your views here.
#テスト用
def test(request, note_id):
    if request.method == "POST":
        data = request.POST
    try:
        Box.objects.get
    return render(request, 'note/note.html')

def box_handler(request, note_id, box_id):
    if request.method == "GET":
        Box.objects.get(pk = note_id)
    elif request.method == "POST":
    elif request.method == "PUT":
        data = request.PUT
        range = data["range"]
        box = Box(x=range["x"], y=range["y"], width=range["width"], height=range["height"],
                    value)
    elif request.method == "DELETE":
        box = Box.objects.get(pk = note_id)
        box.delete()

def note_handler(request, note_id):
    if request.method == "GET":
        noteData = Note.objects.get(pk = note_id)
        childrenData = Box.objects.get(parent_id = note_id)
        noteData.children = childrenData
        return JsonResponse(noteData)
    elif request.method == "POST":
    elif request.method == "PUT":
    elif request.method == "DELETE":

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
