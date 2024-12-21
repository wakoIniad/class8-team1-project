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
        return { 'name': data['name'] } if data['name'] else {}
    
    def put_processer(self, process, **kwargs):
        note_id = process()
        data = { 
            'target': note_id
        }
        
        short_url = DefaultApiHandler.callAPI(
            kwargs['request'], method='PUT', 
            url='share/', 
            data=data 
        )
        print(kwargs)
        return { id: note_id, short_url: short_url }
    
    def put_response(self, response, **kwargs):
        return JsonResponse(response)

    
    def get_processer(self, process, **kwargs):        
        result = process()
        result["children"] = [ child.json() for child in kwargs["refs"]["note_id"] ]
        return result
    
Interface = NoteApiHandler()