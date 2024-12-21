from .default_api_handler import DefaultApiHandler
from .models import ShortURL
from . import constants

class ShareApiHandler(DefaultApiHandler):
    KeyModel = ShortURL
    KeyQuery = 'short_url'
    
    constants = constants

    def get_model_initialization(self, data, queries):
        return { 'target': data.target }
    

Interface = ShareApiHandler()