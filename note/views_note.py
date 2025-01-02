import subprocess

from django.views.decorators.cache import never_cache
from django.shortcuts import render, redirect
from .models import Note, Box, ShortURL
from .default_api_handler import DefaultApiHandler
from django.http import HttpResponse, Http404, JsonResponse, QueryDict
from . import my_utils
from .constants import API_RESPONSES, SYSTEM_API_PATH_SEGMENT

import json
import requests

NODE_JS_SERVER_PORT = 3000
# Create your views here.
#テスト用

@never_cache
def test(request):
    #新しいノートを作成するテスト
    return render(request, 'note/test.html')

@never_cache
def note_list(request):
    context = {
        'title': '過去ノート一覧'
    }
    return render(request, 'note/note_list.html', context)

@never_cache
def editor(request, note_id):
    try:
        note = Note.objects.get(pk = note_id)
    except Note.DoesNotExist: 
        raise Http404("404")
    
    context = {
        "nodejs_server_port": NODE_JS_SERVER_PORT,
        "SYSTEM_API_PATH_SEGMENT": SYSTEM_API_PATH_SEGMENT,
        "note": { 
            "name": note.name,
            "posted_at": note.created_at,
            "updated_at": note.updated_at,
            "id": note.id,
            "editor": {
            }
        }
    }
    
    return render(request, 'note/editor.html', context)

@never_cache
def home(request):
    context = {
        'title': 'ホーム画面'
    }
    return render(request, 'note/home.html', context)


#  process = subprocess.run( ["node", "socketio_server.js"],  # Node.jsスクリプトの実行コマンド
#      stdout=subprocess.PIPE,  # 標準出力をキャプチャ
#      stderr=subprocess.PIPE,  # 標準エラー出力もキャプチャ（必要なら）
#      bufsize=1,               # 出力を逐次フラッシュ
#      text=True,               # 出力を文字列として扱う
#  )
#  
#  # 標準出力をリアルタイムで表示
#  try:
#      for line in process.stdout:
#          print(line.strip())  # 出力を1行ずつ処理して表示
#  except KeyboardInterrupt:
#      print("プロセスを終了します。")