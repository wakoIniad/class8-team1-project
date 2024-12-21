from django.urls import path, register_converter
from . import converters, views_share

register_converter(converters.ShortURL, "shorturl")

## このファイルは /share から 転送されています！
## なのでこのファイルでpathを /with と指定したら、 /share/with となります!
## (class8-team1-project/config/urls.py を見て)
urlpatterns = [
    path('<shorturl:short_url>/', views_share.shortURL_redirect, name='share'),
]