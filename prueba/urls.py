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
from django.contrib.auth import views as auth_views
from django.conf import settings
from django.conf.urls.static import static

def index(request):
    return render(request, "index.html")

urlpatterns = [
    path("admin/", admin.site.urls),

##opcional, si no funciona "" como principal
    path("", index, name="index"),#raíz
    path("index/", index, name="index"),#opcional

##mostrar menu.html
    path("menu/", views.menu_view, name="menu"), 

##creacion del pedido
    path('crear_pedido/', views.crear_pedido, name='crear_pedido'),

##crud
    path("api/platillos/", views.listar_platillos, name="listar_platillos"),
    path("api/platillos/crear/", views.crear_platillo, name="crear_platillo"),
    path("api/platillos/<int:id>/editar/", views.editar_platillo, name="editar_platillo"),
    path("api/platillos/<int:id>/eliminar/", views.eliminar_platillo, name="eliminar_platillo"),

##menu del administrador
    path('admin-menu/', views.admin_menu, name='admin_menu'),
    path('mesero_menu/', views.mesero_menu, name='mesero_menu'),
    path('cocinero/', views.cocinero, name='cocina_menu'),
    path("crear_empleado/", views.crear_empleado, name="crear_empleado"),

##Ingreso de usuario, se debe crear un superusuario primero - cambiar por una creacion de usuario
    # path('login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='/'), name='logout'),
    path('login_general/', views.login_general, name='login_general'),

##ver pedidos, cambiar, eliminar - muestra un JSON como respuesta en url
    path('pedido/<int:pedido_id>/cambiar/', views.cambiar_estado_pedido, name='cambiar_estado_pedido'),
    path('pedido/<int:pedido_id>/eliminar/', views.eliminar_pedido, name='eliminar_pedido'),
    # path('pedido/<int:pedido_id>/', views.detalle_pedido, name='detalle_pedido'),
    path('pedidos/pendientes/', views.pedidos_pendientes, name='pedidos_pendientes'),
    path('api/pedidos/pendientes/', views.pedidos_pendientes, name='pedidos_pendientes'),
#MESERO API
    path('api/pedidos/nuevos/', views.pedidos_nuevos_api, name='pedidos_nuevos_api'),
    path('api/pedido/<int:pedido_id>/enviar_cocina/', views.enviar_a_cocina, name='enviar_a_cocina'),
#MESERO - Ver pedidos listos
path('api/pedidos/listos/', views.pedidos_listos_api, name='pedidos_listos_api'),

#COCINERO API
    path('api/pedidos/en_cocina/', views.pedidos_en_cocina_api, name='pedidos_en_cocina_api'),
    path('api/pedido/<int:pedido_id>/marcar_listo/', views.marcar_listo, name='marcar_listo'),
    path('api/pedido/<int:pedido_id>/volver_cocina/', views.volver_cocina, name='volver_cocina'),
    path('api/pedido/<int:pedido_id>/marcar_entregado/', views.marcar_entregado, name='marcar_entregado'),
    path('logout/<str:rol>/', views.logout_por_rol, name='logout_por_rol'),

]
##Lleva las imagenes para su uso en la parte frontal
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)