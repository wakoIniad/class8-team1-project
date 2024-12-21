from django.http import HttpResponse, Http404, JsonResponse, QueryDict

from . import constants
import json
import random

class DefaultApiHandler:
    Model = None
    constants = constants

    @staticmethod
    def models_get(model, **args):
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

    def handle(self, request, id):
        if request.method != "PUT":
            model = self.models_get(self.Model, pk = id)
            if model is None: return self.constants.API_RESPONSES["MODEL_NOT_FOUND"]

        if request.method in ["POST","PUT"]:
            data = json.loads(request.body)

        if request.method == "GET":
            return self.on_get(model=model)
        elif request.method == "POST":
            return self.on_post(model=model, data=data)
        elif request.method == "PUT":
            return self.on_put(data=data)
        elif request.method == "DELETE":
            return self.on_delete(model=model)
    
    def get_model_initialization(data):
        return { 'target': data.target }
    
    def make_id(ref):
        return random.randint(0,100000000)
    
    def on_put(self, data):
        model = self.Model( **self.get_model_initialization(), pk=self.make_id(ref=[]))
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
