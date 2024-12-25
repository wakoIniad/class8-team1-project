from .default_api_handler import DefaultApiHandler
from django.http import HttpResponse, JsonResponse
from .models import Note, Box, ShortURL
from . import constants, my_utils
import requests

class NoteApiHandler(DefaultApiHandler):
    KeyModel = Note
    KeyQuery = 'note_id'
    RefModels = { 'note_id': Box }
    usingRefs = {
        'PUT': [],
        'POST': [],
        'GET': ['note_id'],
        'DELETE': [],
    }
    constants = constants
    
    def get_model_initialization(self, data, queries):
        print(queries)
        return { 'name': data['name'] } if 'name' in data else ({})
    
    def get_processer(self, process, **kwargs):
        result = process()
        result["children"] = [ child.json() for child in kwargs["refs"]["note_id"] ]
        return result
    
    def make_id(self, queries, ref=[]):
        return my_utils.generated_unique_id()
    
Interface = NoteApiHandler()