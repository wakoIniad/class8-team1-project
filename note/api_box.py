from .default_api_handler import DefaultApiHandler
from .models import Box
from . import constants

class BoxApiHandler(DefaultApiHandler):
    usingModels = { 'note_id': None, 'box_id': Box }
    usingQueries = {
        'PUT': ['note_id'],
        'POST': ['box_id'],
        'GET': ['box_id'],
        'DELETE': ['box_id'],
    }
    constants = constants
    
    def get_model_initialization(data, query):
        range = data["range"]
        return {
            **range,
            "type": data["type"], 
            "parent_id": query["note_id"]
        }
    
Interface = BoxApiHandler()