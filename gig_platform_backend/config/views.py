from django.http import HttpResponse

def home(request):
    return HttpResponse("Backend is running 🚀")