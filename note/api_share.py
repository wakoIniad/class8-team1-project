from .default_api_handler import DefaultApiHandler
from .models import ShortURL
from . import constants, my_utils

class ShareApiHandler(DefaultApiHandler):
    KeyModel = ShortURL
    KeyQuery = 'short_url'
    
    constants = constants

    def get_model_initialization(self, data, queries):
        return { 'target': data['target'] }
    
    def put_processer(self, process, **kwargs):
        result = process()
        short_url = f"{my_utils.get_top_page_url(kwargs['request'])}/share/{result['assigned_id']}/"
        result['short_url'] = short_url
        return result
    

Interface = ShareApiHandler()