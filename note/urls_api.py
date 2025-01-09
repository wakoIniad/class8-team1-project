from django.urls import path, register_converter
from . import converters, api_box, api_note, api_share, views_gpt

register_converter(converters.ShortURL, "shorturl")
register_converter(converters.NoteID, "noteid")
register_converter(converters.BoxID, "boxid")
# api/ のurlにアクセスしたときここに転送するようにしているので、
# ここでpathを call/ と指定したら、 api/call にアクセスしたときに表示されるようになる

urlpatterns = [
    path('note/<noteid:note_id>/<boxid:box_id>/', api_box.Interface.handle, name="box_api"),
    path('note/<noteid:note_id>/', api_note.Interface.handle, name="note_api"),
    path('share/<shorturl:short_url>/', api_share.Interface.handle, name="share_api"),
    path('gpt/', views_gpt.call_gpt, name='gpt')
]