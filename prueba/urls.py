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
    path("menu/", views.menu, name="menu"),

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
    path("api/empleado/<int:empleado_id>/estado/", views.cambiar_estado_empleado, name="cambiar_estado_empleado"),


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
    path("api/pedido/<int:pedido_id>/liberar_mesa/", views.liberar_mesa),



    # -------------------------
    # MESAS
    # -------------------------
    path("api/mesas/", views.mesas_api, name="mesas_api"),
    # path("api/mesa/<int:mesa_id>/pedido/", views.pedido_por_mesa_api, name="pedido_por_mesa_api"), 

    # Reportes Excel
    path("reportes/", views.admin_reportes, name="admin_reportes"),
    path("reportes/ventas/excel/", views.reporte_ventas_excel, name="reporte_ventas_excel"),
    path("reportes/platillos/excel/", views.reporte_platillos_excel, name="reporte_platillos_excel"),
    path("reportes/ventas/filtrado/excel/", views.reporte_ventas_filtrado_excel, name="reporte_ventas_filtrado_excel"),

    # API reportes (filtros)
    path("api/reportes/filtrar/", views.api_reportes_filtrar, name="api_reportes_filtrar"),

    path("api/categorias/", views.api_categorias, name="api_categorias"),
    path("api/pedido/<int:pedido_id>/detalle/", views.api_pedido_detalle, name="api_pedido_detalle"),
    # path("api/pedido/<int:pedido_id>/detalle/", views.api_pedido_detalle),

    path("api/pedido/<int:pedido_id>/additem/", views.agregar_item_pedido),

    path("api/mesa/<int:mesa_id>/pedido/", views.pedido_por_mesa, name="pedido_por_mesa"),
    # path("mesa/<int:numero>/", views.mesa_qr_view, name="mesa_qr_view"),

    #rutas de pago
    # path("pago/resumen/", views.pago_resumen, name="pago_resumen"),
    # path("pago/webpay/iniciar/", views.webpay_iniciar, name="webpay_iniciar"),
    # path("pago/webpay/retorno/", views.webpay_retorno, name="webpay_retorno"),
    # path("guardar_carrito/", views.guardar_carrito, name="guardar_carrito"),

    path("pago/guardar_carrito/", views.guardar_carrito, name="guardar_carrito"),
    path("pago/resumen/", views.pago_resumen, name="pago_resumen"),
    path("pago/webpay/iniciar/", views.webpay_iniciar, name="webpay_iniciar"),
    path("pago/webpay/confirmar/", views.webpay_retorno, name="webpay_retorno"),


    #QR
    # path("cliente/mesa/<int:mesa_id>/", views.confirmar_mesa_qr, name="confirmar_mesa_qr"),

    # QR → formulario con PIN
    # path("cliente/mesa/<int:numero>/", views.mesa_qr, name="mesa_qr"),
    path("cliente/mesas/", views.mesa_qr, name="mesa_qr"),
    # path("cliente/mesas/", views.mesa_qr, name="seleccion_mesas"),

    # Validación → mesa_confirmada.html
    # path("cliente/mesa/<int:numero>/confirmar/", views.confirmar_mesa, name="confirmar_mesa"), revisar
    # path("cliente/seleccionar/", views.seleccionar_mesa_manual, name="seleccionar_mesa_manual"),

    #vista general para el flujo unificado
    # path("cliente/mesas/", views.seleccion_mesas, name="seleccion_mesas"),

    # path("cliente/mesa/<int:mesa_id>/confirmar/", views.confirmar_mesa_qr, name="confirmar_mesa_qr"), REVISAR
    # path("cliente/mesa/<int:mesa_id>/", views.mesa_qr, name="mesa_qr"),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)