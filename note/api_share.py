from .default_api_handler import DefaultApiHandler
from .models import ShortURL
from . import constants

class Interface(DefaultApiHandler):
    usingModels = { 'short_url': ShortURL }
    usingQueries = {
        'PUT': [],
        'POST': ['short_url'],
        'GET': ['short_url'],
        'DELETE': ['short_url'],
    }
    constants = constants

    def get_model_initialization(data):
        return { 'target': data.target }