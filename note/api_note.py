from .default_api_handler import DefaultApiHandler
from .models import Note, Box
from . import constants

class NoteApiHandler(DefaultApiHandler):
    KeyModel = Note
    KeyQuery = 'note_id'
    RefModels = { 'note_id': Box }
    usingQueries = {
        'PUT': [],
        'POST': [],
        'GET': ['note_id'],
        'DELETE': [],
    }
    constants = constants
    
    def get_model_initialization(self, data, queries):
        range = data["range"]
        return {
            **range,
            "type": data["type"], 
            "parent_id": queries["note_id"]
        }
    
    def get_processer(self, process, **kwargs):
        result = super().get_processer(process, **kwargs)
        print(kwargs)
        result["child"] = kwargs["refs"]
        return result
    
Interface = NoteApiHandler()