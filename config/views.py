from django.shortcuts import redirect, render
from django.http import Http404

def redirect_view(request):
    response = redirect('note/')
    print(type(response))
    return response

def landing(request):
    return render(request, 'note/landing.html')
