import logging
logger = logging.getLogger('development')

from django.http import HttpResponse, Http404, JsonResponse, QueryDict
from django.db import models

from . import constants, my_utils
import json, random, requests

from functools import partial

class DefaultApiHandler:
    KeyModel = models.Model
    KeyQuery = ""
    RefModels = {  }
    usingRefs = {
        'PUT': [],
        'POST': [],
        'GET': [],
        'DELETE': [],
    }
    constants = constants

    @staticmethod
    def callAPI(self, request, method, url, data):
        url = f"{my_utils.get_top_page_url(request)}/api/note/{url}"
        print(url)
        data = {
            **data,
            'headers': {
                'X-CSRFToken': my_utils.get_csrftoken(request),
            }
        }
        result = requests.request(method, url, data=data)
        print(result)

    def models_get(self, model, **args):
        try:
            return model.objects.get(**args)
        except model.DoesNotExist:
            return None
        except Exception as e:
            raise e
    
    def update_model(self, model, data):
        for i, key in enumerate(data["update_keys"]):
            setattr(model, key, data["update_values"][i])
        model.save()

    def handle(self, request, **kwargs):
        print(kwargs)
        key_query = kwargs[self.KeyQuery]
        key_model = None
        if request.method != "PUT":
            key_model = self.models_get(self.KeyModel, pk=key_query)
            if key_model is None: return self.constants.API_RESPONSES["MODEL_NOT_FOUND"]
        
        ref_models = { q: self.RefModels[q].objects.filter( parent_id = kwargs[q]) 
                  for q in self.usingRefs[request.method] if self.RefModels[q] is not None }
        queries = { q: kwargs[q] for q in self.usingRefs[request.method]}

        data = {}
        if request.method in ["POST","PUT"]:
            data = json.loads(request.body)

        kwargs = { 'model': key_model, 'data': data, 'queries': queries, 'refs': ref_models, 'request': request }
        if request.method == "PUT":
            return self.on_put(**kwargs)
        elif request.method == "POST":
            return self.on_post(**kwargs)
        elif request.method == "GET":
            return self.on_get(**kwargs)
        elif request.method == "DELETE":
            return self.on_delete(**kwargs)
    
    def get_model_initialization(self, data, queries):
        return {}
    
    def make_id(self, ref=[]):
        return random.randint(0,100000000)
    
    def on_put(self, **kwargs):
        def process():
            model = self.KeyModel( pk=self.make_id(ref=[]), **self.get_model_initialization(kwargs["data"], kwargs["queries"]))
            model.save()
            return model.pk
        
        result = self.put_processer(process, **kwargs)
        response = self.put_response(result, **kwargs)
        return response

    def on_post(self, **kwargs):
        def process():
            return self.update_model(kwargs["model"], kwargs["data"])

        result = self.post_processer(process, **kwargs)
        response = self.post_response(result, **kwargs)
        return response

    def on_get(self, **kwargs):
        result = self.get_processer(kwargs["model"].json, **kwargs)
        response = self.get_response(result, **kwargs)
        return response
    
    def on_delete(self, **kwargs):
        result = self.delete_processer(kwargs["model"].delete, **kwargs)
        response = self.get_response(result, **kwargs)
        return response
    
    def put_response(self, response, **kwargs):
        return HttpResponse(response)

    def post_response(self, response, **kwargs):
        return self.constants.API_RESPONSES["SUCCESS"]
    
    def delete_response(self, response, **kwargs):
        return self.constants.API_RESPONSES["SUCCESS"]

    def get_response(self, response, **kwargs):
        return JsonResponse(response)
    
    def put_processer(self, process, **kwargs):
        return process()

    def post_processer(self, process, **kwargs):
        return process()
    
    def delete_processer(self, process, **kwargs):
        return process()

    def get_processer(self, process, **kwargs):
        return process()