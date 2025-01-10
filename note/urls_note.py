from django.urls import path, register_converter
from . import converters, views_note

register_converter(converters.NoteID, "noteid")
register_converter(converters.BoxID, "boxid")
# note/ のurlにアクセスしたときここに転送するようにしているので、
# ここでpathを new/ と指定したら、 note/new にアクセスしたときに表示されるようになる

urlpatterns = [
    path('test/', views_note.test),
    path('editor/<noteid:note_id>/', views_note.editor, name="editor"),

#(?P<note_id>[a-zA-Z0-9]*)

    #shareの方と揃えるためにマージするときは 下の１行だけ 'list/' にしてほしい!
    path('list/', views_note.note_list, name='note_list'),
    path('', views_note.home, name='home'),
    path('404/', views_note.display404, name='404'),
    
]