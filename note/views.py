from django.shortcuts import render

# Create your views here.
#テスト用
def test(request):
    return render(request, 'note/note.html')