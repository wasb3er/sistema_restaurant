from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from .models import Platillo, DetallePedido, Pedido, Empleado, Mesa
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.views.decorators.http import require_POST
from django.contrib.auth import authenticate, login
from django.contrib.auth.hashers import make_password, check_password
from django.contrib import messages
from functools import wraps
from django.contrib.sessions.backends.db import SessionStore
from django.utils.timezone import localtime
import json
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile

import openpyxl
from openpyxl.styles import Font, Alignment
from django.http import HttpResponse

#Para la resolución de imagen
def redimensionar_imagen(imagen, ancho=612, alto=408):
    """Redimensiona cualquier imagen a 612x408 manteniendo calidad."""
    img = Image.open(imagen)

    # Convertir a RGB si viene en PNG con alpha
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    img = img.resize((ancho, alto), Image.Resampling.LANCZOS)

    buffer = BytesIO()
    img.save(buffer, format="JPEG", quality=90)
    return ContentFile(buffer.getvalue())

# CAMBIO: se normaliza comparación de roles (minúsculas, sin espacios)
def rol_requerido(rol_permitido):
    """Valida que el usuario tenga sesión válida según el rol, con cookie independiente."""
    def decorador(vista_func):
        @wraps(vista_func)
        def _wrapped_view(request, *args, **kwargs):
            cookie_name = f"sessionid_{rol_permitido.strip().lower()}"
            session_key = request.COOKIES.get(cookie_name)

            if not session_key:
                return redirect('login_general')

            session = SessionStore(session_key=session_key)
            if not session or not session.get("empleado_rol"):
                return redirect('login_general')

            rol = session.get("empleado_rol", "").strip().lower()
            if rol != rol_permitido.strip().lower():
                return redirect('login_general')

            request.session = session
            return vista_func(request, *args, **kwargs)
        return _wrapped_view
    return decorador

# VISTAS PRINCIPALES
def index(request):
    return render(request, "index.html")


# CAMBIO: eliminado @login_required, solo se usa rol_requerido
@rol_requerido("Cocinero")
def cocinero(request):
    empleado_nombre = request.session.get("empleado_nombre", "Cocinero")
    return render(request, 'cocinero.html', {"empleado_nombre": empleado_nombre})


def menu_view(request):
    platillos = Platillo.objects.all()
    return render(request, "menu.html", {"platillos": platillos, "user": request.user})


# CREAR PEDIDO
@csrf_exempt
@require_POST
def crear_pedido(request):
    try:
        data = json.loads(request.body)

        # 1) VALIDAR QUE LLEGUE mesa_id
        mesa_raw = data.get('mesa_id')
        if mesa_raw is None or mesa_raw == "" or mesa_raw == "null":
            return JsonResponse({"success": False, "error": "ID de mesa no enviado"})

        # 2) CONVERTIR A ENTERO CON TRY
        try:
            mesa_id = int(mesa_raw)
        except:
            return JsonResponse({"success": False, "error": "ID de mesa inválido"})

        # 3) BUSCAR LA MESA CORRECTAMENTE
        try:
            mesa = Mesa.objects.get(numero=mesa_id)
        except Mesa.DoesNotExist:
            return JsonResponse({"success": False, "error": "Mesa no encontrada"})

        nombre = data.get('nombre')
        personas = data.get('personas')
        platillos = data.get('platillos')

        if not platillos:
            return JsonResponse({'success': False, 'error': 'El carrito está vacío'})

        # Crear pedido
        pedido = Pedido.objects.create(
            nombre_cliente=nombre,
            personas=personas,
            mesa=mesa,
            total=0,
            estado='nuevo'
        )

        total = 0
        for item in platillos:
            platillo = Platillo.objects.get(pk=item['id'])
            cantidad = int(item.get('cantidad', 1))

            if cantidad > platillo.cantidad:
                return JsonResponse({
                    'success': False,
                    'error': f'Solo quedan {platillo.cantidad} unidades de {platillo.nombre}'
                })

            subtotal = platillo.precio * cantidad

            DetallePedido.objects.create(
                pedido=pedido,
                platillo=platillo,
                cantidad=cantidad,
                subtotal=subtotal
            )

            platillo.cantidad -= cantidad
            platillo.save()

            total += subtotal

        pedido.total = total
        pedido.save()

        return JsonResponse({
            'success': True,
            'pedido_id': pedido.id,
            'total': float(total),
            'estado': pedido.estado,
            'mesa_id': mesa.id
        })

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

    

# CRUD DE PLATILLOS
@csrf_exempt
def crear_platillo(request):
    if request.method == 'POST':
        try:
            nombre = request.POST.get('nombre')
            descripcion = request.POST.get('descripcion')
            precio = request.POST.get('precio')
            cantidad = request.POST.get('cantidad', 0)
            imagen = request.FILES.get('imagen')

            nuevo_platillo = Platillo(
                nombre=nombre,
                descripcion=descripcion,
                precio=precio,
                cantidad=cantidad
            )
            # Si subieron una imagen: redimensionarla
            if imagen:
                imagen_redimensionada = redimensionar_imagen(imagen)
                nuevo_platillo.imagen.save(imagen.name, imagen_redimensionada, save=False)

            nuevo_platillo.save()
            return JsonResponse({'success': True})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)



def listar_platillos(request):
    platillos = list(Platillo.objects.values())
    return JsonResponse({'platillos': platillos})


@csrf_exempt
def editar_platillo(request, id):
    try:
        if request.method != "POST":
            return JsonResponse({"success": False, "error": "Método no permitido"}, status=405)

        platillo = get_object_or_404(Platillo, id=id)

        # Actualizar campos
        platillo.nombre = request.POST.get("nombre", platillo.nombre)
        platillo.descripcion = request.POST.get("descripcion", platillo.descripcion)

        # Convertir precio y cantidad (evita errores si vienen vacíos)
        precio = request.POST.get("precio")
        cantidad = request.POST.get("cantidad")

        if precio:
            platillo.precio = float(precio)

        if cantidad:
            platillo.cantidad = int(cantidad)

        # Si llega una imagen nueva, reemplazarla
        if "imagen" in request.FILES:
            imagen_original = request.FILES["imagen"]
            imagen_redimensionada = redimensionar_imagen(imagen_original)
            platillo.imagen.save(imagen_original.name, imagen_redimensionada, save=False)

        platillo.save()

        return JsonResponse({"success": True})

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)




@csrf_exempt
def eliminar_platillo(request, id):
    if request.method == 'DELETE':
        try:
            platillo = get_object_or_404(Platillo, id=id)
            platillo.delete()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)


# CAMBIO: eliminado @login_required
@rol_requerido("administrador")
def admin_menu(request):
    platillos = Platillo.objects.all()
    empleados = Empleado.objects.all()
    pedidos = Pedido.objects.all()
    return render(request, 'admin/admin-menu.html', {
        'platillos': platillos,
        'empleados': empleados,
        'pedidos': pedidos,
    })

@rol_requerido("administrador")
def admin_reportes(request):
    return render(request, "admin/reportes.html")

# CAMBIO: eliminado @login_required
@rol_requerido("administrador")
def cambiar_estado_pedido(request, pedido_id):
    try:
        pedido = Pedido.objects.get(id=pedido_id)
        pedido.estado = 'terminado' if pedido.estado == 'pendiente' else 'pendiente'
        pedido.save()
        return JsonResponse({'success': True, 'nuevo_estado': pedido.estado})
    except Pedido.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Pedido no encontrado'}, status=404)


# CAMBIO: eliminado @login_required
@rol_requerido("administrador")
def eliminar_pedido(request, pedido_id):
    pedido = get_object_or_404(Pedido, id=pedido_id)
    pedido.delete()
    return redirect('admin_menu')


# CAMBIO: eliminado @login_required
@rol_requerido("administrador")
def pedidos_pendientes(request):
    pedidos = Pedido.objects.filter(estado='pendiente').order_by('-id')
    data = [
        {
            "id": p.id,
            "nombre_cliente": p.nombre_cliente,
            "personas": p.personas,
            "total": float(p.total),
            "fecha": p.fecha.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for p in pedidos
    ]
    return JsonResponse(data, safe=False)


# LOGIN GENERAL
@csrf_protect
def login_general(request):
    if request.method == 'POST':
        tipo = request.POST.get("tipoLogin")
        username = request.POST.get("username")
        password = request.POST.get("password")

#LOGIN ADMIN
        if tipo == "admin":
            user = authenticate(username=username, password=password)
            if user:
                session = SessionStore()
                session["empleado_id"] = user.id
                session["empleado_nombre"] = user.username
                session["empleado_rol"] = "administrador"
                session.save()

                response = redirect('admin_menu')
                response.set_cookie("sessionid_administrador", session.session_key, httponly=True)
                return response
            else:
                messages.error(request, "Credenciales inválidas para administrador.")
                return render(request, 'login.html')

#LOGIN EMPLEADO
        elif tipo == "empleado":
            empleado = Empleado.objects.filter(username=username, activo=True).first()
            if not empleado:
                messages.error(request, "Usuario no encontrado o inactivo.")
                return render(request, 'login.html')

            if check_password(password, empleado.password):
                session = SessionStore()
                session["empleado_id"] = empleado.id
                session["empleado_nombre"] = empleado.nombre
                session["empleado_rol"] = empleado.rol
                session.save()

                rol = empleado.rol.strip().lower()
                if rol == "mesero":
                    response = redirect('mesero_menu')
                    cookie_name = "sessionid_mesero"
                elif rol == "cocinero":
                    response = redirect('cocina_menu')
                    cookie_name = "sessionid_cocinero"
                else:
                    response = redirect('admin_menu')
                    cookie_name = "sessionid_admin"

                response.set_cookie(cookie_name, session.session_key, httponly=True)
                return response
            else:
                messages.error(request, "Contraseña incorrecta.")
                return render(request, 'login.html')

        else:
            messages.error(request, "Selecciona el tipo de usuario antes de ingresar.")
            return render(request, 'login.html')

    return render(request, 'login.html')

#LOGOUT POR ROL
def logout_por_rol(request, rol):
    cookie_name = f"sessionid_{rol.strip().lower()}"
    response = redirect('login_general')
    response.delete_cookie(cookie_name)
    return response

#eliminado @login_required
@rol_requerido("cocinero")
def cocina_menu(request):
    empleado_nombre = request.session.get("empleado_nombre", "Cocinero")
    return render(request, 'cocinero.html', {"empleado_nombre": empleado_nombre})


#eliminado @login_required
@rol_requerido("mesero")
def mesero_menu(request):
    empleado_nombre = request.session.get("empleado_nombre", "Mesero")
    return render(request, 'mesero_menu.html', {"empleado_nombre": empleado_nombre})


#eliminado @login_required
@csrf_exempt
@rol_requerido("administrador")
def crear_empleado(request):
    if request.method == "POST":
        nombre = request.POST.get("nombre")
        username = request.POST.get("username")
        password = request.POST.get("password")
        rol = request.POST.get("rol", "Mesero")

        if not nombre or not username or not password:
            return JsonResponse({"success": False, "error": "Faltan datos obligatorios"})

        if Empleado.objects.filter(username=username).exists():
            return JsonResponse({"success": False, "error": "El usuario ya existe"})

        nuevo = Empleado(
            nombre=nombre,
            username=username,
            rol=rol,
            password=make_password(password),
            activo=True
        )
        nuevo.save()

        return JsonResponse({
            "success": True,
            "message": f"Empleado '{nombre}' agregado correctamente."
        })

    return JsonResponse({"success": False, "error": "Método no permitido"}, status=405)



from django.utils.timezone import localtime

#API para mostrar pedidos NUEVOS (vista del MESERO)
def pedidos_nuevos_api(request):
    try:
        pedidos = Pedido.objects.filter(estado__in=['nuevo', 'pendiente']).order_by('-fecha')
        data = [
            {
                "id": p.id,
                "nombre_cliente": p.nombre_cliente,
                "personas": p.personas,
                "total": float(p.total),
                "fecha": p.fecha.strftime("%Y-%m-%d %H:%M:%S") if p.fecha else None,
                "estado": p.estado
            }
            for p in pedidos
        ]
        return JsonResponse({"pedidos": data})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


#API para que el MESERO envíe un pedido a cocina
@csrf_exempt
def enviar_a_cocina(request, pedido_id):
    try:
        pedido = Pedido.objects.get(pk=pedido_id)
        if pedido.estado not in ['nuevo', 'pendiente']:
            return JsonResponse({"success": False, "error": "El pedido ya fue procesado o no está disponible."})
        pedido.estado = 'enviado_a_cocina'
        pedido.save()
        return JsonResponse({"success": True, "message": "Pedido enviado a cocina correctamente."})
    except Pedido.DoesNotExist:
        return JsonResponse({"success": False, "error": "Pedido no encontrado."})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})
    

#API para pedidos del cocinero (en cocina o listos)
def pedidos_en_cocina_api(request):
    try:
        pedidos = Pedido.objects.filter(estado='enviado_a_cocina').order_by('-fecha')
        data = [
            {
                "id": p.id,
                "nombre_cliente": p.nombre_cliente,
                "personas": p.personas,
                "total": float(p.total),
                "fecha": p.fecha.strftime("%Y-%m-%d %H:%M:%S") if p.fecha else None,
                "estado": p.estado
            }
            for p in pedidos
        ]
        return JsonResponse({"pedidos": data})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


#Marcar pedido como listo
@csrf_exempt
def marcar_listo(request, pedido_id):
    try:
        pedido = Pedido.objects.get(pk=pedido_id)
        pedido.estado = 'listo'
        pedido.save()
        return JsonResponse({"success": True})
    except Pedido.DoesNotExist:
        return JsonResponse({"success": False, "error": "Pedido no encontrado."})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})


#Volver a estado "enviado_a_cocina"
@csrf_exempt
def volver_cocina(request, pedido_id):
    try:
        pedido = Pedido.objects.get(pk=pedido_id)
        pedido.estado = 'enviado_a_cocina'
        pedido.save()
        return JsonResponse({"success": True})
    except Pedido.DoesNotExist:
        return JsonResponse({"success": False, "error": "Pedido no encontrado."})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})
    
#API para pedidos listos (mesero los ve para entregar)
def pedidos_listos_api(request):
    try:
        pedidos = Pedido.objects.filter(estado='listo').order_by('-fecha')
        data = [
            {
                "id": p.id,
                "nombre_cliente": p.nombre_cliente,
                "personas": p.personas,
                "total": float(p.total),
                "fecha": p.fecha.strftime("%Y-%m-%d %H:%M:%S") if p.fecha else None,
                "estado": p.estado
            }
            for p in pedidos
        ]
        return JsonResponse({"pedidos": data})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def marcar_entregado(request, pedido_id):
    try:
        pedido = Pedido.objects.get(pk=pedido_id)
        pedido.estado = 'entregado'
        pedido.save()
        return JsonResponse({"success": True})
    except Pedido.DoesNotExist:
        return JsonResponse({"success": False, "error": "Pedido no encontrado."})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})
    

def mesas_api(request):
    try:
        mesas = Mesa.objects.all()
        data = []

        for mesa in mesas:
            pedido = Pedido.objects.filter(mesa=mesa).exclude(estado="entregado").first()

            # Intentar extraer mesero (solo si el modelo tiene el campo)
            mesero_nombre = None
            if pedido:
                if hasattr(pedido, "empleado") and pedido.empleado:
                    mesero_nombre = getattr(pedido.empleado, "nombre", None)

            mesa_info = {
                "id": mesa.id,
                "numero": mesa.numero,
                "estado": mesa.estado,
                "mesero": mesero_nombre,
                "pedido": None
            }
            if pedido:
                mesa_info["pedido"] = {
                    "id": pedido.id,
                    "cliente": getattr(pedido, "nombre_cliente", None),
                    "personas": getattr(pedido, "personas", None),
                    "estado": pedido.estado,
                    "total": pedido.total,
                    "fecha": pedido.fecha.strftime("%Y-%m-%d %H:%M:%S"),
                }

            data.append(mesa_info)

        return JsonResponse({"mesas": data})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def pedido_por_mesa_api(request, mesa_id):
    try:
        mesa = Mesa.objects.get(pk=mesa_id)
        pedido = Pedido.objects.filter(mesa_id=mesa_id).order_by('-fecha').first()

        if not pedido:
            return JsonResponse({
                "mesa": {
                    "id": mesa.id,
                    "numero": mesa.numero,
                },
                "pedido": None
            })

        return JsonResponse({
            "mesa": {
                "id": mesa.id,
                "numero": mesa.numero,
            },
            "pedido": {
                "id": pedido.id,
                "cliente": pedido.nombre_cliente,
                "personas": pedido.personas,
                "total": float(pedido.total),
                "estado": pedido.estado,
                "fecha": pedido.fecha.strftime("%Y-%m-%d %H:%M:%S")
            }
        })

    except Mesa.DoesNotExist:
        return JsonResponse({"error": "Mesa no existe"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def api_pedidos(request):
    try:
        pedidos = Pedido.objects.order_by('-id')

        data = []

        for p in pedidos:
            # Fecha segura
            fecha = None
            if hasattr(p, "fecha") and p.fecha:
                try:
                    fecha = p.fecha.strftime("%Y-%m-%d %H:%M:%S")
                except:
                    fecha = None

            data.append({
                "id": p.id,
                "cliente": getattr(p, "nombre_cliente", "N/A") or "N/A",
                "personas": getattr(p, "personas", 0) or 0,
                "total": float(getattr(p, "total", 0) or 0),
                "estado": getattr(p, "estado", "N/A"),
                "fecha": fecha,
            })

        return JsonResponse({"pedidos": data})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def api_platillos(request):
    platillos = Platillo.objects.all()
    data = [{
        "id": p.id,
        "nombre": p.nombre,
        "descripcion": p.descripcion,
        "precio": float(p.precio),
        "cantidad": p.cantidad,
    } for p in platillos]

    return JsonResponse(data, safe=False)

@csrf_exempt
def toggle_empleado_activo(request, empleado_id):
    try:
        empleado = get_object_or_404(Empleado, id=empleado_id)

        # Invertir el estado
        empleado.activo = not empleado.activo
        empleado.save()

        return JsonResponse({
            "success": True,
            "activo": empleado.activo,
            "message": "Empleado actualizado correctamente"
        })
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})


@rol_requerido("administrador")
def reporte_ventas_excel(request):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Ventas"

    # Encabezados
    headers = ["ID Pedido", "Cliente", "Personas", "Total", "Estado", "Fecha"]
    ws.append(headers)

    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal="center")

    pedidos = Pedido.objects.order_by("-fecha")

    for p in pedidos:
        ws.append([
            p.id,
            p.nombre_cliente,
            p.personas,
            float(p.total),
            p.estado,
            p.fecha.strftime("%Y-%m-%d %H:%M")
        ])

    # Preparar respuesta
    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response['Content-Disposition'] = 'attachment; filename="reporte_ventas.xlsx"'

    wb.save(response)
    return response

@rol_requerido("administrador")
def reporte_platillos_excel(request):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Platillos"

    headers = ["Platillo", "Total Vendido", "Ingresos Generados"]
    ws.append(headers)

    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal="center")

    platillos = Platillo.objects.all()

    for pl in platillos:
        detalles = DetallePedido.objects.filter(platillo=pl)
        total_vendido = sum(d.cantidad for d in detalles)
        ingresos = sum(float(d.subtotal) for d in detalles)

        ws.append([pl.nombre, total_vendido, ingresos])

    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response['Content-Disposition'] = 'attachment; filename="reporte_platillos.xlsx"'

    wb.save(response)
    return response


#Asignar mesero
# @csrf_exempt
# def asignar_mesero(request, mesa_id):
#     try:
#         data = json.loads(request.body)
#         mesero_id = data.get("mesero_id")

#         mesa = Mesa.objects.get(pk=mesa_id)
#         mesero = Empleado.objects.get(pk=mesero_id, rol="Mesero")

#         mesa.mesero = mesero
#         mesa.save()

#         return JsonResponse({"success": True})
#     except Exception as e:
#         return JsonResponse({"success": False, "error": str(e)}, status=500)
