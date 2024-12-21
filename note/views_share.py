from django.views.decorators.cache import never_cache
from django.shortcuts import render, redirect
from .models import ShortURL
from django.http import HttpResponse, Http404, JsonResponse, QueryDict
from . import my_utils
from .constants import API_RESPONSES

import json

@never_cache
def shortURL_redirect(request, short_url):
    try:
        short_url = ShortURL.objects.get(pk = short_url)
    except ShortURL.DoesNotExist: 
        raise Http404("404")
    
    top_page_url = my_utils.get_top_page_url(request)
    return redirect(f"{top_page_url}/note/{short_url.target}/editor")