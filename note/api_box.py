from .default_api_handler import DefaultApiHandler
from .models import Box
#from . import constants
from . import constants, my_utils

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
    
    def make_id(self, queries, ref=[]):
        return queries['note_id'] + '-' + my_utils.generated_unique_id()
    
    def post_processer(self, process, **kwargs):
        if kwargs["model"] is not None and \
            kwargs["model"].type == 'image' and\
            "value" in kwargs["data"]["update_keys"]:
            i = kwargs["data"]["update_keys"].index("value")
            kwargs["data"]["update_values"][i] = \
                my_utils.compress_base64_image(kwargs["data"]["update_values"][i], 1000)
        return super().post_processer(process, **kwargs)
    
Interface = BoxApiHandler()