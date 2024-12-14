from django.shortcuts import render

# Create your views here.
#テスト用
def test(request):
    return render(request, 'note/note.html')

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
