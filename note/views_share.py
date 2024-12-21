from django.shortcuts import render, redirect
from .models import ShortURL
from django.http import HttpResponse, Http404, JsonResponse, QueryDict
from . import my_lib


def shortURL_redirect(request, short_url):
    try:
        short_url = ShortURL.objects.get(pk=short_url)
        top_page_url = my_lib.get_top_page_url(request)
        return redirect(f"{top_page_url}/note/{short_url.target}/editor")
    except ShortURL.DoesNotExist: 
        raise Http404("404")