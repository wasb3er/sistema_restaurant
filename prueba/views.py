from django.shortcuts import render
def index(request):
    return HttpResponse("¡Hola, Django ya está usando tu vista!")

from django.http import HttpResponse

def menu_view(request):
    return render(request, "menu.html")