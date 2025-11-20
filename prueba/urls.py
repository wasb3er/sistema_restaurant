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

    # -------------------------
    # SISTEMA BASE
    # -------------------------
    path("admin/", admin.site.urls),

    # Home
    path("", views.index, name="index"),
    path("index/", views.index, name="index"),

    # LOGIN GENERAL
    path("login/", views.login_general, name="login_general"),

    # Menú del cliente
    path("menu/", views.menu_view, name="menu"),

    # Crear pedido (cliente)
    path("crear_pedido/", views.crear_pedido, name="crear_pedido"),


    # -------------------------
    # PANEL ADMINISTRADOR
    # -------------------------
    path("admin-menu/", views.admin_menu, name="admin_menu"),
    path("crear_empleado/", views.crear_empleado, name="crear_empleado"),
    path("logout/<str:rol>/", views.logout_por_rol, name="logout_por_rol"),

    # CRUD platillos
    path("api/platillos/", views.api_platillos, name="api_platillos"),
    path("api/platillos/crear/", views.crear_platillo, name="crear_platillo"),

    # *** FIX IMPORTANTE ***
    path("api/platillos/<int:id>/editar/", views.editar_platillo, name="editar_platillo"),

    path("api/platillos/eliminar/<int:id>/", views.eliminar_platillo, name="eliminar_platillo"),

    # API empleados (toggle activo)
    path("api/empleado/<int:empleado_id>/toggle/", views.toggle_empleado_activo, name="toggle_empleado"),


    # -------------------------
    # PEDIDOS (ADMIN)
    # -------------------------
    path("api/pedidos/", views.api_pedidos, name="api_pedidos"),
    path("api/pedidos/pendientes/", views.pedidos_pendientes, name="pedidos_pendientes"),

    # Gestionar pedido desde admin
    path("pedido/<int:pedido_id>/cambiar/", views.cambiar_estado_pedido, name="cambiar_estado_pedido"),
    path("pedido/<int:pedido_id>/eliminar/", views.eliminar_pedido, name="eliminar_pedido"),


    # -------------------------
    # MESERO
    # -------------------------
    path("mesero_menu/", views.mesero_menu, name="mesero_menu"),

    path("api/pedidos/nuevos/", views.pedidos_nuevos_api, name="pedidos_nuevos_api"),
    path("api/pedidos/listos/", views.pedidos_listos_api, name="pedidos_listos_api"),

    path("api/pedido/<int:pedido_id>/enviar_cocina/", views.enviar_a_cocina, name="enviar_a_cocina"),


    # -------------------------
    # COCINERO
    # -------------------------
    path("cocinero/", views.cocinero, name="cocina_menu"),

    path("api/pedidos/en_cocina/", views.pedidos_en_cocina_api, name="pedidos_en_cocina_api"),

    path("api/pedido/<int:pedido_id>/marcar_listo/", views.marcar_listo, name="marcar_listo"),
    path("api/pedido/<int:pedido_id>/volver_cocina/", views.volver_cocina, name="volver_cocina"),
    path("api/pedido/<int:pedido_id>/marcar_entregado/", views.marcar_entregado, name="marcar_entregado"),


    # -------------------------
    # MESAS
    # -------------------------
    path("api/mesas/", views.mesas_api, name="mesas_api"),
    path("api/mesa/<int:mesa_id>/pedido/", views.pedido_por_mesa_api, name="pedido_por_mesa_api"),

    # Reportes Excel
    path("reportes/", views.admin_reportes, name="admin_reportes"),
    path("reportes/ventas/excel/", views.reporte_ventas_excel, name="reporte_ventas_excel"),
    path("reportes/platillos/excel/", views.reporte_platillos_excel, name="reporte_platillos_excel"),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)