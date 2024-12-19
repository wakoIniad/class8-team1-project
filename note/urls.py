from django.urls import path
from . import views

# note/ のurlにアクセスしたときここに転送するようにしているので、
# ここでpathを new/ と指定したら、 note/new にアクセスしたときに表示されるようになる

urlpatterns = [
    path('test/<str:note_id>', views.test),
    path('new/', views.new_note, name='new_note'),
    path('<str:note_id>/', views.be_made_note, name='be_made_note'),

    #下の(?P...)っていうやつはURLの指定に正規表現が使えるやつです。正規表現はCS1のどこかで習ったはず
    #多機能: https://regex101.com/
    #置換サイト: https://www.ipentec.com/utils/WebTextUtility/ReplaceText/
    #検索サイト: https://weblabo.oscasierra.net/tools/regex/
    #こういうwebアプリがあって、
    #英語のライティングでコロンの後のスペースが抜けてないかチェックする時とかに使えて意外と便利
    #コロンやカンマの後にスペースがない場合表示する正規表現:([.,][^ ])
    #頑張ればIEEEの形式チェックにも使えると思う
    #xxxx-yyyy-zzzz
    path('api/<str:note_id>/<str:box_id>/', views.box_api_handler, name="box_api"),
    path('api/<str:note_id>/', views.note_api_handler, name="note_api"),
#(?P<note_id>[a-zA-Z0-9]*)
    path('new_note/', views.new_note, name='new_note'),
    path('be_made_note/', views.be_made_note, name='be_made_note'),
    path('', views.home, name='home'),
]