from django.shortcuts import render

# Create your views here.
#テスト用
def test(request):
    return render(request, 'note/note.html')

def new_note(request):
    return render(request, 'new_note/new_note.html')

def be_made_note(request):
    return render(request, 'be_made_note/be_made_note.html')