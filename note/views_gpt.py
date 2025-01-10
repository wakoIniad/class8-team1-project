from django.http import HttpResponse
import os
# 必要なモジュールの import
from langchain.agents import Tool, initialize_agent, AgentType
from langchain.chat_models import ChatOpenAI
from langchain.schema import AIMessage, HumanMessage, SystemMessage
import requests

OPENAI_API_KEY = 'K5jP1E2JE258_uR-I4_TwVRjZmugqQm4BCPOLtP6aRwFeAmTdkGOiEsowJQmhEPZgylNqPEOOjXAh7PHmU5vNKA'
OPENAI_API_BASE = 'https://api.openai.iniad.org/api/v1'

chat = ChatOpenAI(openai_api_key=OPENAI_API_KEY, openai_api_base=OPENAI_API_BASE, model_name='gpt-4o-mini', temperature=0.5)

def call_gpt(request):
    message = request.GET.get('message', '');
    if message:
        result = chat([HumanMessage(content=message)])
        result = result.content
        return HttpResponse(result);