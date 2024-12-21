from .default_api_handler import DefaultApiHandler
from .models import ShortURL
from . import constants

class Interface(DefaultApiHandler):
    Model = ShortURL
    constants = constants

    def get_model_initialization(data):
        return { 'target': data.target }