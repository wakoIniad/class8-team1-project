from django.http import HttpResponse, Http404, JsonResponse, QueryDict

MODEL_NOT_FOUND_MESSAGE = "BoxDoesNotExist"
UNEXPECTED_ERROR_MESSAGE = "ErrorUnexpected"

API_RESPONSES = {
    "MODEL_NOT_FOUND": HttpResponse(MODEL_NOT_FOUND_MESSAGE,status=404),
    "UNEXPECTED_ERROR_MESSAGE": HttpResponse(UNEXPECTED_ERROR_MESSAGE,status=500),
    "SUCCESS": HttpResponse(status=200),
}