from django.http import HttpResponse, Http404, JsonResponse
from .constants import UNEXPECTED_ERROR_MESSAGE
import random

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

def models_get(model, **args):
    try:
        return model.objects.get(**args)
    except model.DoesNotExist:
        return None
    except Exception as e:
        print(UNEXPECTED_ERROR_MESSAGE)
        raise e
    
def api_update_handler(model, data):
    for i, key in enumerate(data["update_keys"]):
        setattr(model, key, data["update_values"][i])
    model.save()