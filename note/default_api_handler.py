import logging
logger = logging.getLogger('development')

from django.http import HttpResponse, Http404, JsonResponse, QueryDict
from django.db import models

from . import constants
import json
import random

class DefaultApiHandler:
    usingModels = { 'id': models.Model }
    usingQueries = {
        'PUT': [],
        'POST': ['id'],
        'GET': ['id'],
        'DELETE': ['id'],
    }
    constants = constants

    def models_get(model, **args):
        try:
            return model.objects.get(**args)
        except model.DoesNotExist:
            return None
        except Exception as e:
            raise e
    
    def update_model(model, data):
        for i, key in enumerate(data["update_keys"]):
            setattr(model, key, data["update_values"][i])
        model.save()

    def handle(self, request, **kwargs):
        print(kwargs)
        models = { q: self.models_get(self.usingModels[q], pk = kwargs[q]) 
                  for q in self.usingQueries[request.method] if self.usingModels[q] is not None }
        queries = { q: kwargs[q] for q in self.usingQueries[request.method]}
        if None in models.values(): return self.constants.API_RESPONSES["MODEL_NOT_FOUND"]

        if request.method in ["POST","PUT"]:
            data = json.loads(request.body)

        keyModel = list(models.values())[-1] if len(models) else None
        keyQuery = list(queries.values())[-1] if len(queries) else None
        if request.method == "GET":
            return self.on_get(model=keyModel)
        elif request.method == "POST":
            return self.on_post(model=keyModel, data=data)
        elif request.method == "PUT":
            return self.on_put(queries=queries, data=data)
        elif request.method == "DELETE":
            return self.on_delete(model=keyModel)
    
    def get_model_initialization(self, data, queries):
        return {}
    
    def make_id(self, ref=[]):
        return random.randint(0,100000000)
    
    def on_put(self, queries, data):
        model = self.usingModels[self.usingQueries["PUT"][0]]( pk=self.make_id(ref=[]), **self.get_model_initialization(data, queries))
        model.save()
        return HttpResponse(model.objects.pk)

    def on_post(self, model, data):
        self.api_update_handler(model, data)
        return self.constants.API_RESPONSES["SUCCESS"]

    def on_get(self, model):
        return JsonResponse(model.json())
    
    def on_delete(self, model):
        model.delete()
        return self.constants.API_RESPONSES["SUCCESS"]
