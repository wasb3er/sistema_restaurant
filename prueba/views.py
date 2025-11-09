from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse, HttpResponseForbidden
from .models import Platillo, DetallePedido, Pedido, Empleado
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login
import json
from django.contrib.auth.hashers import make_password
from django.contrib import messages
from django.views.decorators.csrf import csrf_protect


#Página de inicio
def index(request):
    return render(request, "index.html")


#Vista del menú general
def menu_view(request):
    platillos = Platillo.objects.all()
    return render(request, "menu.html", {"platillos": platillos, "user": request.user})


#CREAR PEDIDO
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
            estado='pendiente'
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
        return JsonResponse({'success': True, 'pedido_id': pedido.id, 'total': float(total)})

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


#CRUD PLATILLOS
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


#ADMINISTRADOR
@login_required
# def admin_menu(request):
#     pedidos = Pedido.objects.all().order_by('-id')
#     platillos = Platillo.objects.all()
#     return render(request, 'admin-menu.html', {'pedidos': pedidos, 'platillos': platillos})
def admin_menu(request):
    from .models import Platillo, Empleado
    platillos = Platillo.objects.all()
    empleados = Empleado.objects.all()
    pedidos = Pedido.objects.all() if 'Pedido' in globals() else []

    return render(request, 'admin-menu.html', {
        'platillos': platillos,
        'empleados': empleados,
        'pedidos': pedidos,
    })

@login_required
def cambiar_estado_pedido(request, pedido_id):
    try:
        pedido = Pedido.objects.get(id=pedido_id)
        pedido.estado = 'terminado' if pedido.estado == 'pendiente' else 'pendiente'
        pedido.save()
        return JsonResponse({'success': True, 'nuevo_estado': pedido.estado})
    except Pedido.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Pedido no encontrado'}, status=404)


@login_required
def eliminar_pedido(request, pedido_id):
    pedido = get_object_or_404(Pedido, id=pedido_id)
    pedido.delete()
    return redirect('admin_menu')


@login_required
def detalle_pedido(request, pedido_id):
    try:
        pedido = Pedido.objects.get(pk=pedido_id, estado='pendiente')
        data = {
            "id": pedido.id,
            "nombre_cliente": pedido.nombre_cliente,
            "personas": pedido.personas,
            "total": float(pedido.total),
            "estado": pedido.estado,
            "fecha": pedido.fecha.strftime("%Y-%m-%d %H:%M:%S"),
        }
        return JsonResponse(data, safe=False)
    except Pedido.DoesNotExist:
        return JsonResponse({"error": "Pedido no encontrado o ya terminado"}, status=404)


@login_required
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


#LOGIN GENERAL (admin o empleado)
@csrf_protect
def login_general(request):
    if request.method == 'POST':
        tipo = request.POST.get("tipoLogin")  # admin o empleado
        username = request.POST.get("username")
        password = request.POST.get("password")

        # ----ADMINISTRADOR----
        if tipo == "admin":
            user = authenticate(username=username, password=password)
            if user:
                #Limpia cualquier sesión previa (por seguridad)
                request.session.flush()

                #Inicia sesión con el sistema de Django
                login(request, user)

                #Guarda datos del admin para mantener consistencia
                request.session["empleado_id"] = user.id
                request.session["empleado_nombre"] = user.username
                request.session["empleado_rol"] = "Administrador"

                return redirect('admin_menu')
            else:
                messages.error(request, "Credenciales inválidas para administrador.")
                return render(request, 'login.html')

        # ----EMPLEADO (Mesero/Cocinero)----
        elif tipo == "empleado":
            empleado = Empleado.objects.filter(username=username, activo=True).first()
            if empleado and empleado.check_password(password):
                #Limpia sesión previa antes de crear nueva
                request.session.flush()

                #Guarda info del empleado logueado
                request.session["empleado_id"] = empleado.id
                request.session["empleado_nombre"] = empleado.nombre
                request.session["empleado_rol"] = empleado.rol

                #Redirige según rol
                if empleado.rol == "Mesero":
                    return redirect('mesero_menu')
                elif empleado.rol == "Cocinero":
                    return redirect('cocina_menu')
                else:
                    return redirect('admin_menu')
            else:
                messages.error(request, "❌ Credenciales inválidas para empleado.")
                return render(request, 'login.html')

    #Si es GET, mostrar formulario normalmente
    return render(request, 'login.html')


#MESERO
def mesero_menu(request):
    empleado_nombre = request.session.get("empleado_nombre", "Mesero")
    return render(request, 'mesero_menu.html', {"empleado_nombre": empleado_nombre})

#Crear usuario empleado mesero/cocinero
@login_required(login_url='/login_general/')
def crear_empleado(request):
    #Solo el administrador puede crear empleados
    if request.session.get("empleado_rol") != "Administrador":
        return HttpResponseForbidden("No tienes permiso para crear empleados.")

    if request.method == 'POST':
        nombre = request.POST.get('nombre')
        username = request.POST.get('username')
        password = request.POST.get('password')
        rol = request.POST.get('rol', 'Mesero')

        if not nombre or not username or not password:
            messages.error(request, "❌ Faltan datos requeridos.")
            return redirect('admin_menu')

        if Empleado.objects.filter(username=username).exists():
            messages.warning(request, f"⚠️ El usuario '{username}' ya existe.")
            return redirect('admin_menu')

        try:
            nuevo = Empleado(
                nombre=nombre,
                username=username,
                rol=rol,
                password=make_password(password),
                activo=True
            )
            nuevo.save()
            messages.success(request, f"Mesero '{nombre}' agregado correctamente.")
            return redirect('admin_menu')
        except Exception as e:
            messages.error(request, f"Error al crear empleado: {e}")
            return redirect('admin_menu')

    #Si no es POST, redirigir al panel
    return redirect('admin_menu')
