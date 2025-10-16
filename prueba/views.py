from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import Platillo, DetallePedido, Pedido
from django.shortcuts import render, get_object_or_404
import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required

def index(request):
    return HttpResponse("¡Hola, Django ya está usando tu vista!")

from django.http import HttpResponse

def menu_view(request):
    platillos = Platillo.objects.all()
    return render(request, "menu.html", {"platillos": platillos, "user": request.user})

##DESCONTAR EL PLATILLO DEL DIA
@csrf_exempt ##SOLO PARA PRUEBAS, CAMBIAR EL TOKEN A UNO MAS SEGURO -- HACER PRUEBAS
@require_POST ##RESTRINGE EL ACCESO SOLAMENTE A POST
def crear_pedido(request):
    try:
        data = json.loads(request.body)

        nombre = data.get('nombre')
        personas = data.get('personas')
        platillos = data.get('platillos')  #debe coincidir con el JS

        if not platillos or len(platillos) == 0:
            return JsonResponse({'success': False, 'error': 'El carrito está vacío'})

        #Crear el pedido principal
        pedido = Pedido.objects.create(
            nombre_cliente=nombre,
            personas=personas,
            total=0,
            estado='pendiente'
        )

        total = 0
        for item in platillos:
            try:
                platillo = Platillo.objects.get(pk=item['id'])
            except Platillo.DoesNotExist:
                return JsonResponse({'success': False, 'error': f"Platillo con ID {item['id']} no existe."})

            cantidad = int(item.get('cantidad', 1))

            if platillo.cantidad < cantidad:
                return JsonResponse({'success': False, 'error': f"No hay suficiente stock de {platillo.nombre}"})

            subtotal = platillo.precio * cantidad

            #Crear detalle del pedido
            DetallePedido.objects.create(
                pedido=pedido,
                platillo=platillo,
                cantidad=cantidad,
                subtotal=subtotal
            )

            #Descontar la cantidad del platillo
            platillo.cantidad -= cantidad
            platillo.save()

            total += subtotal

        pedido.total = total
        pedido.save()

        return JsonResponse({'success': True, 'pedido_id': pedido.id, 'total': float(total)})

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Error al procesar los datos JSON'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

##CREAR
@csrf_exempt
def crear_platillo(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            Platillo.objects.create(
                nombre=data.get('nombre'),
                descripcion=data.get('descripcion'),
                precio=data.get('precio'),
                cantidad=data.get('cantidad', 0)
            )
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)

##LEER
def listar_platillos(request):
    platillos = list(Platillo.objects.values())
    return JsonResponse({'platillos': platillos})

##MODIFICAR
@csrf_exempt
def editar_platillo(request, id):
    if request.method == 'PUT':
        try:
            platillo = get_object_or_404(Platillo, id=id)
            data = json.loads(request.body)

            platillo.nombre = data.get('nombre', platillo.nombre)
            platillo.descripcion = data.get('descripcion', platillo.descripcion)
            platillo.precio = data.get('precio', platillo.precio)
            platillo.cantidad = data.get('cantidad', platillo.cantidad)
            platillo.save()

            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)

##ELIMINAR
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

##PARA INGRESAR A LA VISTA ADMIN SERÁ SOLAMENTE CON LOGIN REQUEST, SI NO SE CAERA - HACER UN BOTON PARA INGRESAR USUARIO - CAMBIAR
@login_required
def admin_menu(request):
    pedidos = Pedido.objects.all().order_by('-id')
    platillos = Platillo.objects.all()
    return render(request, 'admin-menu.html', {
        'pedidos': pedidos,
        'platillos': platillos
    })

@login_required
def cambiar_estado_pedido(request, pedido_id):
    pedido = get_object_or_404(Pedido, id=pedido_id)
    if pedido.estado == 'pendiente':
        pedido.estado = 'terminado'
    else:
        pedido.estado = 'pendiente'
    pedido.save()
    return redirect('admin_menu')

##
@login_required
def eliminar_pedido(request, pedido_id):
    pedido = get_object_or_404(Pedido, id=pedido_id)
    pedido.delete()
    return redirect('admin_menu')

##muestra el detalle, json para ver si el pedido ya termino y fue eliminado
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

##mostrar los pedidos pendientes en la url
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
