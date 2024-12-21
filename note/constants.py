from django.http import HttpResponse, Http404, HttpResponseServerError, JsonResponse, QueryDict
import json

MODEL_NOT_FOUND_MESSAGE = "ModelDoesNotExist"
UNEXPECTED_ERROR_MESSAGE = "ErrorUnexpected"
ADVICE_MESSAGE_FORTEAM = "Ctrl + Shift + Iで開く開発者ツールからNetworkタブを見れば、詳細が見れるよ"

API_RESPONSES = {
    "MODEL_NOT_FOUND": HttpResponseServerError(json.dumps({
            'message': 'Not Found Error (404)', 
            'details': MODEL_NOT_FOUND_MESSAGE + '\n' + ADVICE_MESSAGE_FORTEAM,
        }),
        content_type='application/json',
        status=404
    ),
    "UNEXPECTED_ERROR_MESSAGE": HttpResponseServerError(json.dumps({
            'message': 'Server Error (500)', 
            'details': UNEXPECTED_ERROR_MESSAGE + '\n' + ADVICE_MESSAGE_FORTEAM
        }),
        content_type='application/json',
        status=500
    ),
    "SUCCESS": HttpResponse(json.dumps({
            'message': 'API Calling Success', 
            'details': ADVICE_MESSAGE_FORTEAM,
        }),
        content_type='application/json',
        status=200
    ),
}

SYSTEM_API_PATH_SEGMENT = 'SYSTEM'