from django.shortcuts import render, redirect
from .models import ShortURL
from django.http import HttpResponse, Http404, JsonResponse, QueryDict
from . import my_utils
from .constants import API_RESPONSES

import json

def shortURL_redirect(request, short_url):
    try:
        short_url = ShortURL.objects.get(pk = short_url)
    except ShortURL.DoesNotExist: 
        raise Http404("404")
    
    top_page_url = my_utils.get_top_page_url(request)
    return redirect(f"{top_page_url}/note/{short_url.target}/editor")
    
def share_api_handler(request, short_url):
    if request.method != "PUT":
        short_url = my_utils.models_get(ShortURL, pk = short_url)
        if short_url is None: return API_RESPONSES["MODEL_NOT_FOUND"]
        
    print("shortAPI",short_url)
    if request.method == "GET":
        return JsonResponse(short_url.json())
    
    elif request.method == "POST":
        data = json.loads(request.body)
        my_utils.api_update_handler(short_url, data)
        return API_RESPONSES["SUCCESS"]
    
    elif request.method == "PUT":
        data = json.loads(request.body)
        short_url = ShortURL(target=data.target,path=my_utils.make_id(ref=[]))
        short_url.save()
        return HttpResponse(short_url.path)
    
    elif request.method == "DELETE":
        short_url.delete()
        return API_RESPONSES["SUCCESS"]