from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from .models import Platillo, DetallePedido, Pedido, Empleado
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.views.decorators.http import require_POST
from django.contrib.auth import authenticate, login
from django.contrib.auth.hashers import make_password, check_password
from django.contrib import messages
from functools import wraps
from django.contrib.sessions.backends.db import SessionStore
from django.utils.timezone import localtime
import json


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
        nombre = data.get('nombre')
        personas = data.get('personas')
        platillos = data.get('platillos')

        if not platillos:
            return JsonResponse({'success': False, 'error': 'El carrito está vacío'})

        pedido = Pedido.objects.create(
            nombre_cliente=nombre,
            personas=personas,
            total=0,
            estado='nuevo'
        )

        total = 0
        for item in platillos:
            platillo = Platillo.objects.get(pk=item['id'])
            cantidad = int(item.get('cantidad', 1))

            if platillo.cantidad < cantidad:
                return JsonResponse({'success': False, 'error': f"No hay suficiente stock de {platillo.nombre}"})

            subtotal = platillo.precio * cantidad
            DetallePedido.objects.create(pedido=pedido, platillo=platillo, cantidad=cantidad, subtotal=subtotal)
            platillo.cantidad -= cantidad
            platillo.save()
            total += subtotal

        pedido.total = total
        pedido.save()
        return JsonResponse({'success': True, 'pedido_id': pedido.id, 'total': float(total), 'estado': pedido.estado})

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

            Platillo.objects.create(
                nombre=nombre,
                descripcion=descripcion,
                precio=precio,
                cantidad=cantidad,
                imagen=imagen
            )
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
        platillo = get_object_or_404(Platillo, id=id)

        if request.method == "PUT":
            data = json.loads(request.body)
            platillo.nombre = data.get("nombre", platillo.nombre)
            platillo.descripcion = data.get("descripcion", platillo.descripcion)
            platillo.precio = data.get("precio", platillo.precio)
            platillo.cantidad = data.get("cantidad", platillo.cantidad)
            platillo.save()
            return JsonResponse({"success": True})

        elif request.method == "POST":
            platillo.nombre = request.POST.get("nombre", platillo.nombre)
            platillo.descripcion = request.POST.get("descripcion", platillo.descripcion)
            platillo.precio = request.POST.get("precio", platillo.precio)
            platillo.cantidad = request.POST.get("cantidad", platillo.cantidad)

            if 'imagen' in request.FILES:
                platillo.imagen = request.FILES['imagen']

            platillo.save()
            return JsonResponse({"success": True})

        return JsonResponse({"success": False, "error": "Método no permitido"}, status=405)

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})


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
    return render(request, 'admin-menu.html', {
        'platillos': platillos,
        'empleados': empleados,
        'pedidos': pedidos,
    })


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
@rol_requerido("administrador")
def crear_empleado(request):
    if request.method == 'POST':
        nombre = request.POST.get('nombre')
        username = request.POST.get('username')
        password = request.POST.get('password')
        rol = request.POST.get('rol', 'Mesero')

        if not nombre or not username or not password:
            messages.error(request, "Faltan datos requeridos.")
            return redirect('admin_menu')

        if Empleado.objects.filter(username=username).exists():
            messages.warning(request, f"El usuario '{username}' ya existe.")
            return redirect('admin_menu')

        nuevo = Empleado(
            nombre=nombre,
            username=username,
            rol=rol,
            password=make_password(password),
            activo=True
        )
        nuevo.save()
        messages.success(request, f"Empleado '{nombre}' agregado correctamente.")
        return redirect('admin_menu')

    return redirect('admin_menu')



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