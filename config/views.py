from django.shortcuts import redirect


def redirect_view(request):
    response = redirect('note/')
    print(type(response)) 
    return response