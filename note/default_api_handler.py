import logging
logger = logging.getLogger('development')

from django.http import HttpResponse, Http404, JsonResponse, QueryDict
from django.db import models

from . import constants
import json
import random

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
        if request.method != "PUT":
            key_model = self.models_get(self.KeyModel, pk=key_query)
        
        ref_models = { q: self.RefModels[q].objects.filter( parent_id = kwargs[q]) 
                  for q in self.usingRefs[request.method] if self.RefModels[q] is not None }
        queries = { q: kwargs[q] for q in self.usingRefs[request.method]}
        if key_model is None: return self.constants.API_RESPONSES["MODEL_NOT_FOUND"]

        if request.method in ["POST","PUT"]:
            data = json.loads(request.body)

        if request.method == "PUT":
            return self.on_put(data=data, queries=queries, refs=ref_models)
        elif request.method == "POST":
            return self.on_post(model=key_model, data=data, refs=ref_models)
        elif request.method == "GET":
            return self.on_get(model=key_model, refs=ref_models)
        elif request.method == "DELETE":
            return self.on_delete(model=key_model, refs=ref_models)
    
    def get_model_initialization(self, data, queries):
        return {}
    
    def make_id(self, ref=[]):
        return random.randint(0,100000000)
    
    def on_put(self, data, queries, refs):
        def process(self=self, data=data, queries=queries):
            model = self.KeyModel( pk=self.make_id(ref=[]), **self.get_model_initialization(data, queries))
            model.save()
            return model
        
        result = self.put_processer(process, data, queries, refs)
        response = self.put_response(result, data, queries, refs)
        return response

    def on_post(self, model, data, refs):
        process = partial(self.update_model, self, model, data)

        result = self.post_processer(process, model, data, refs)
        response = self.post_response(result, model, data, refs)
        return response

    def on_get(self, model, refs):
        result = self.get_processer(model.json, model, refs)
        response = self.get_response(result, model, refs)
        return response
    
    def on_delete(self, model, refs):
        result = self.delete_processer(model.delete, model, refs)
        response = self.get_response(result, model, refs)
        return response
    
    def put_response(self, response, model, data, refs):
        return HttpResponse(response.pk)

    def post_response(self, response, model, data, refs):
        return self.constants.API_RESPONSES["SUCCESS"]
    
    def delete_response(self, response, refs, model):
        return self.constants.API_RESPONSES["SUCCESS"]

    def get_response(self, response, refs, model):
        return JsonResponse(response)
    
    def put_processer(self, process, model, data, refs):
        return process()

    def post_processer(self, process, model, data, refs):
        process()
    
    def delete_processer(self, process, refs, model):
        process()

    def get_processer(self, process, refs, model):
        return process()