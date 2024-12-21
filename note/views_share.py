from django.shortcuts import render, redirect
from .models import ShortURL
from django.http import HttpResponse, Http404, JsonResponse, QueryDict
from . import my_lib

def shortURL_redirect(request, short_url):
    try:
        short_url = ShortURL.objects.get(pk=short_url)
        return redirect(f"{short_url.target}/editor")
    except ShortURL.DoesNotExist: 
        raise Http404("404")