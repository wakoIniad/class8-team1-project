from django.urls import path
from . import views

urlpatterns = [
    path('test/', views.test),
    path('new_note/', views.new_note, name='new_note'),
    path('be_made_note/', views.be_made_note, name='be_made_note'),
    path('', views.home, name='home'),
]