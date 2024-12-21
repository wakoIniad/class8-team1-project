from django.http import HttpResponse, Http404, HttpResponseServerError, JsonResponse, QueryDict
import json

MODEL_NOT_FOUND_MESSAGE = "ModelDoesNotExist"
UNEXPECTED_ERROR_MESSAGE = "ErrorUnexpected"

API_RESPONSES = {
    "MODEL_NOT_FOUND": HttpResponseServerError(json.dumps({
            'message': 'Not Found Error (404)', 
            'details': MODEL_NOT_FOUND_MESSAGE,
        }),
        content_type='application/json',
        status=404
    ),
    "UNEXPECTED_ERROR_MESSAGE": HttpResponseServerError(json.dumps({
            'message': 'Server Error (500)', 
            'details': UNEXPECTED_ERROR_MESSAGE
        }),
        content_type='application/json',
        status=500
    ),
    "SUCCESS": HttpResponse(status=200),
}