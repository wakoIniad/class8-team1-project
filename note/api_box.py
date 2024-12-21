from .default_api_handler import DefaultApiHandler
from .models import Box
from . import constants

class BoxApiHandler(DefaultApiHandler):
    KeyModel = Box
    KeyQuery = 'box_id'
    RefModels = { 'note_id': None }
    usingRefs = {
        'PUT': ['note_id'],
        'POST': [],
        'GET': [],
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
    
Interface = BoxApiHandler()