from django.urls import path, register_converter
from . import views, converters

register_converter(converters.NoteID, "noteid")
register_converter(converters.BoxID, "boxid")
register_converter(converters.ShortURL, "shortlink")
# note/ のurlにアクセスしたときここに転送するようにしているので、
# ここでpathを new/ と指定したら、 note/new にアクセスしたときに表示されるようになる

urlpatterns = [
    path('test/<noteid:note_id>', views.test),
    path('<noteid:note_id>/editor', views.editor, name="editor"),
    path('<shorturl:short_url>/share', views.ShortURL),

    path('api/<noteid:note_id>/<boxid:box_id>/', views.box_api_handler, name="box_api"),
    path('api/<noteid:note_id>/', views.note_api_handler, name="note_api"),
#(?P<note_id>[a-zA-Z0-9]*)

    path('new/', views.new_note, name='new_note'),
    path('all/', views.be_made_note, name='be_made_note'),
    path('', views.home, name='home'),
]