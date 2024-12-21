from django.http import HttpResponse, Http404, JsonResponse
from .constants import UNEXPECTED_ERROR_MESSAGE
from . import my_utils
import random
import requests


def make_id(ref=[]):
    return random.randint(0,100000000)

from django.conf import settings

def get_top_page_url(request):
    ## requestsから直接取得する方法が主流っぽいけど、そうすると
    ## 外部から変なアクセスがあった場合にそこに転送されそうで怖いので念のため.
    default_host = settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else "localhost"
    top_page_url = f"{request.scheme}://{default_host}/"
    if default_host in ["localhost", "127.0.0.1", "::1"]:
        port = request.META.get("SERVER_PORT", "8000") 
        top_page_url = f"{request.scheme}://{default_host}:{port}/"
    else:
        top_page_url = f"{request.scheme}://{default_host}/"

    return top_page_url



#https://stackoverflow.com/questions/13567507/passing-csrftoken-with-python-requests
#def get_csrftoken(request):
#    URL = my_utils.get_top_page_url(request)
#    client = requests.session()
#
#    # Retrieve the CSRF token first
#    client.get(URL)  # sets cookie
#    if 'csrftoken' in client.cookies:
#        # Django 1.6 and up
#        csrftoken = client.cookies['csrftoken']
#    else:
#        # older versions
#        csrftoken = client.cookies['csrf']
#    return csrftoken

def get_csrftoken(request):
    return request.META.get('HTTP_X_CSRFTOKEN', '')