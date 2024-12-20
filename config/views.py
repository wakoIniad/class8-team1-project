from django.shortcuts import redirect


def redirect_view(request):
    response = redirect('/note/')
    print(type(response)) 
    return response

def new_view(request):
    return render(request, 'home.html')