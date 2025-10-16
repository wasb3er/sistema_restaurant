from django.db import models

#Muestra la tabla de los platillos, poder seleccionar y descontar -- actualizar: seleccionar y que se agregue a un carrito
class Platillo(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cantidad = models.IntegerField(default=0)  #reemplazamos disponible
    creado_en = models.DateTimeField(auto_now_add=True)

##class meta no creara una tabla si no la que se creo manualmente con psql, repetir proceso para cada clase
    class Meta:
        db_table = 'platillos' #Se usa la tabla ya hecha
        managed = False #No crea ni modifica la tabla ya existente


##toma el pedido y lo guarda en una tabla creada
class Pedido(models.Model):
    nombre_cliente = models.CharField(max_length=100)
    personas = models.IntegerField(default=1)
    fecha = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estado = models.CharField(max_length=20, default='pendiente')
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pedido'   
        managed = False       

    def __str__(self):
        return f"Pedido #{self.id} - {self.nombre_cliente}"

##toma el detalle del pedido, relacionada
class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles')
    platillo = models.ForeignKey('Platillo', on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'detalle_pedido'  
        managed = False

    def __str__(self):
        return f"{self.platillo.nombre} x {self.cantidad}"