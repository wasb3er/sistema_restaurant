from django.shortcuts import render
from django.http import JsonResponse
from .models import Platillo, DetallePedido, Pedido
from django.shortcuts import render, get_object_or_404 #
import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

def index(request):
    return HttpResponse("¡Hola, Django ya está usando tu vista!")

from django.http import HttpResponse

def menu_view(request):
    platillos = Platillo.objects.all()
    return render(request, "menu.html", {"platillos": platillos})

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





##BORRAR CODIGO DE PRUEBAS, LIMPIAR VIEWS

##DESCONTAR PLATILLO, SOLO JS, NO GUARDA NADA

# @csrf_exempt
# def descontar_platillo(request, id):
#     if request.method == "POST":
#         try:
#             platillo = Platillo.objects.get(pk=id)
#             if platillo.cantidad > 0:
#                 platillo.cantidad -= 1
#                 platillo.save()
#                 return JsonResponse({'success': True, 'nueva_cantidad': platillo.cantidad})
#             else:
#                 return JsonResponse({'success': False, 'error': 'Sin stock disponible'})
#         except Platillo.DoesNotExist:
#             return JsonResponse({'success': False, 'error': 'Platillo no encontrado'})
#     return JsonResponse({'success': False, 'error': 'Método no permitido'})




# def descontar_cantidad(request, platillo_id):
#     platillo = get_object_or_404(Platillo, id=platillo_id)

#     if platillo.cantidad > 0:
#         platillo.cantidad -= 1
#         platillo.save()
#         return JsonResponse({'success': True, 'nueva_cantidad': platillo.cantidad})
#     else:
#         return JsonResponse({'success': False, 'error': 'Sin stock disponible'})




# def lista_platillos(request):
#     platillos = list(Platillo.objects.values())
#     return JsonResponse({'platillos': platillos})

##MUESTRA LA LISTA DE PLATILLOS
# def menu(request):
#     platillos = Platillo.objects.all()
#     return render(request, 'menu.html', {'platillos': platillos})
