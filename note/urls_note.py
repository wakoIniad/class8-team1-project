from django.urls import path, register_converter
from . import converters, views_note

register_converter(converters.NoteID, "noteid")
register_converter(converters.BoxID, "boxid")
# note/ のurlにアクセスしたときここに転送するようにしているので、
# ここでpathを new/ と指定したら、 note/new にアクセスしたときに表示されるようになる

urlpatterns = [
    path('test/<noteid:note_id>', views_note.test),
    path('<noteid:note_id>/editor', views_note.editor, name="editor"),

    path('api/<noteid:note_id>/<boxid:box_id>/', views_note.box_api_handler, name="box_api"),
    path('api/<noteid:note_id>/', views_note.note_api_handler, name="note_api"),
#(?P<note_id>[a-zA-Z0-9]*)

    path('new/', views_note.new_note, name='new_note'),
    #shareの方と揃えるためにマージするときは 下の１行だけ 'list/' にしてほしい!
    path('list/', views_note.be_made_note, name='be_made_note'),
    path('', views_note.home, name='home'),
]