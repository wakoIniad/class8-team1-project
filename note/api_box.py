from .default_api_handler import DefaultApiHandler
from .models import Box
from . import constants

class Interface(DefaultApiHandler):
    Model = Box
    constants = constants
    
    def get_model_initialization(data):
        
        range = data["range"]
        return {
            *range,
            type: data["type"], 
            parent_id: note_id
        }