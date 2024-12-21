from django.http import HttpResponse, Http404, JsonResponse, QueryDict
from django.db import models

from . import constants
import json
import random

class DefaultApiHandler:
    usingModels = [ models.Model ]
    usingQueries = {
        'PUT': [],
        'POST': ['id'],
        'GET': ['id'],
        'DELETE': ['id'],
    }
    constants = constants

    @staticmethod
    def models_get(model, **args):
        try:
            return model.objects.get(**args)
        except model.DoesNotExist:
            return None
        except Exception as e:
            raise e
    
    @staticmethod
    def update_model(self, model, data):
        for i, key in enumerate(data["update_keys"]):
            setattr(model, key, data["update_values"][i])
        model.save()

    @staticmethod
    def handle(self, request, **ids):
        models = { q: self.models_get(self.Model, pk = q) for q in self.usingQueries[request.method]}
        if None in models.values(): return self.constants.API_RESPONSES["MODEL_NOT_FOUND"]

        if request.method in ["POST","PUT"]:
            data = json.loads(request.body)

        if request.method == "GET":
            return self.on_get(model=models[0], models=)
        elif request.method == "POST":
            return self.on_post(model=models[0], data=data)
        elif request.method == "PUT":
            return self.on_put(data=data)
        elif request.method == "DELETE":
            return self.on_delete(model=models[0])
    
    @staticmethod
    def get_model_initialization(data):
        return {}
    
    @staticmethod
    def make_id(ref):
        return random.randint(0,100000000)
    
    @staticmethod
    def on_put(self, data):
        model = self.Model( **self.get_model_initialization(), pk=self.make_id(ref=[]))
        model.save()
        return HttpResponse(model.objects.pk)

    @staticmethod
    def on_post(self, model, data):
        self.api_update_handler(model, data)
        return self.constants.API_RESPONSES["SUCCESS"]

    @staticmethod
    def on_get(self, model):
        return JsonResponse(model.json())
    
    @staticmethod
    def on_delete(self, model):
        model.delete()
        return self.constants.API_RESPONSES["SUCCESS"]
