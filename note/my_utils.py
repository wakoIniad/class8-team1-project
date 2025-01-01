from django.http import HttpResponse, Http404, JsonResponse
from .constants import UNEXPECTED_ERROR_MESSAGE
from . import my_utils
import random
import requests
import time
import string

import base64
from io import BytesIO
from PIL import Image


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

def generated_unique_id():
    characters = [ *string.digits, *string.ascii_letters ]
    l = len(characters)
    timestamp = int(time.time()*1000//1)
    def recrusion(n):
        i = n % l
        if n < l : return characters[i]
        n //= l
        return recrusion(n) + characters[i]
    return recrusion(timestamp)

def clean_base64_string(base64_str):
    if base64_str.startswith('data:image'):
        # 画像データのURL形式（data:image/png;base64,...）を取り除く
        base64_str = base64_str.split(',')[1]
    return base64_str

def compress_base64_image(base64_str, target_size_kb):
    # Base64をデコードして画像データに変換
    image_data = base64.b64decode(clean_base64_string(base64_str))
    image = Image.open(BytesIO(image_data))
    #if image.mode == 'RGBA':
    #        image = image.convert('RGB')

    # 目標サイズをバイトに変換
    target_size_bytes = target_size_kb * 1024
    
    # 初期設定
    quality = 95  # JPEGの圧縮品質
    step = 5  # 品質を下げるステップ

    while True:
        # 画像をバッファに保存して圧縮
        buffer = BytesIO()
        image.save(buffer, format="WebP", quality=quality)
        size = buffer.tell()

        # サイズが目標を満たしている場合、または品質が極端に低い場合に終了
        if size <= target_size_bytes or quality <= 10:
            break
        
        # 品質を下げて再試行
        quality -= step

    # 圧縮された画像をBase64にエンコード
    buffer.seek(0)
    compressed_base64 = base64.b64encode(buffer.read()).decode('utf-8')

    return 'data:image/jpeg;base64,'+compressed_base64