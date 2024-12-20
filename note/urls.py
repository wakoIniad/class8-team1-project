from django.urls import path
from . import views

# note/ のurlにアクセスしたときここに転送するようにしているので、
# ここでpathを new/ と指定したら、 note/new にアクセスしたときに表示されるようになる

urlpatterns = [
    path('test/<str:note_id>', views.test),
    path('<str:note_id>/', views.be_made_note, name='be_made_note'),
    path('api/<str:note_id>/<str:box_id>/', views.box_api_handler, name="box_api"),
    path('api/<str:note_id>/', views.note_api_handler, name="note_api"),
#(?P<note_id>[a-zA-Z0-9]*)


    path('new/', views.new_note, name='new_note'),
    path('all/', views.be_made_note, name='be_made_note'),
    path('', views.home, name='home'),
]