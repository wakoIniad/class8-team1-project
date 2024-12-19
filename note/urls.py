from django.urls import path
from . import views

# note/ のurlにアクセスしたときここに転送するようにしているので、
# ここでpathを new/ と指定したら、 note/new にアクセスしたときに表示されるようになる

urlpatterns = [
    path('test/<int:note_id>', views.test),

    path('new/', views.new_note, name='new_note'),
    path('<int:note_id>/', views.be_made_note, name='be_made_note'),
    path('/', views.home, name='home'),
    
    path('api/<int:note_id>/<int:box_id>/', views.box_handler, name="box_handler")
]