"""
URL configuration for prueba project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.http import HttpResponse
from django.shortcuts import render
from . import views

def index(request):
    return render(request, "index.html")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", index, name="index"),       #raíz
    path("index/", index, name="index"), #opcional, si no funciona "" como principal
    path("menu/", views.menu_view, name="menu"), #mostrar menu.html
    #path('descontar/<int:id>/', views.descontar_platillo, name='descontar_platillo'), #descuenta un platillo, modifica la cantidad -- BORRAR
    path('crear_pedido/', views.crear_pedido, name='crear_pedido'), #creacion del pedido
]
