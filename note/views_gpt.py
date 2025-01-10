from django.http import HttpResponse
import os
# 必要なモジュールの import
from langchain.agents import Tool, initialize_agent, AgentType
from langchain.chat_models import ChatOpenAI
from langchain.schema import AIMessage, HumanMessage, SystemMessage
import requests
import urllib.parse

OPENAI_API_KEY = 'K5jP1E2JE258_uR-I4_TwVRjZmugqQm4BCPOLtP6aRwFeAmTdkGOiEsowJQmhEPZgylNqPEOOjXAh7PHmU5vNKA'
OPENAI_API_BASE = 'https://api.openai.iniad.org/api/v1'

chat = ChatOpenAI(openai_api_key=OPENAI_API_KEY, openai_api_base=OPENAI_API_BASE, model_name='gpt-4o-mini', temperature=0.5)

def call_gpt(request):
    message = urllib.parse.unquote(request.GET.get('message', ''))
    if message:
        result = agent.run(message)
        print('GPT RESPONSE: ', result)
        return HttpResponse(result)

def get_weather(name):
    url = f'https://api.openweathermap.org/data/2.5/weather?q={name}&appid=c6731a69dc98809c1ce62b13fb9e05dc'
    return requests.get(url).json()

tools = [
    Tool.from_function(
        func=get_weather,
        name='get_weather',
        description='天気を取得できます'+
        "第一引数に取得したい都市の名前をローマ字で書きます。例: Tokyo"
    )
]

agent = initialize_agent(tools, chat, handle_parsing_errors=True, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION, verbose=False)