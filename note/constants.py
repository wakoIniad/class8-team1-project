from django.http import HttpResponse, Http404, HttpResponseServerError, JsonResponse, QueryDict
import json

SOCKET_IO_SERVER_URL = "http://localhost:3000"
NODE_JS_SERVER_PORT = 3000

MODEL_NOT_FOUND_MESSAGE = "ModelDoesNotExist"
UNEXPECTED_ERROR_MESSAGE = "ErrorUnexpected"
REQUEST_DATA_TOO_BIG_MESSAGE = "RequestDataIsTooBig"
ADVICE_MESSAGE_FOR_TEAMMEMBER = "Ctrl + Shift + Iで開く開発者ツールからNetworkタブを見れば、詳細が見れます!"

API_RESPONSES = {
    "MODEL_NOT_FOUND": HttpResponseServerError(json.dumps({
            'message': 'NotFoundError', 
            'details': MODEL_NOT_FOUND_MESSAGE,
            'for_cs_team_member': ADVICE_MESSAGE_FOR_TEAMMEMBER,
        }),
        content_type='application/json',
        status=404
    ),
    "UNEXPECTED_ERROR_MESSAGE": HttpResponseServerError(json.dumps({
            'message': 'InternalServerError', 
            'details': UNEXPECTED_ERROR_MESSAGE,
            'for_cs_team_member': ADVICE_MESSAGE_FOR_TEAMMEMBER,
        }),
        content_type='application/json',
        status=500
    ),
    "SUCCESS": HttpResponse(json.dumps({
            'message': 'APICallingSuccess', 
            'details': '',
            'for_cs_team_member': ADVICE_MESSAGE_FOR_TEAMMEMBER,
        }),
        content_type='application/json',
        status=200
    ),
    "REQUEST_DATA_TOO_BIG": HttpResponse(json.dumps({
            'message': 'RequestDataTooBig', 
            'details': REQUEST_DATA_TOO_BIG_MESSAGE,
            'for_cs_team_member': ADVICE_MESSAGE_FOR_TEAMMEMBER,
        }),
        content_type='application/json',
        status=400
    ),

}

SYSTEM_API_PATH_SEGMENT = 'SYSTEM'