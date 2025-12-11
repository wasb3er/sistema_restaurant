from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.hashers import make_password, check_password

#Categoria de comida/bebestibles
class Categoria(models.Model):
    nombre = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["orden"]

    def __str__(self):
        return self.nombre

#Platillo
class Platillo(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cantidad = models.IntegerField(default=0)  #stock disponible
    imagen = models.ImageField(upload_to='platillos/', blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True)
    es_del_dia = models.BooleanField(default=False)

    class Meta:
        db_table = 'platillos'   #Usa la tabla existente
        managed = False          #Django NO la crea ni modifica

    def __str__(self):
        return self.nombre


#pedido
class Pedido(models.Model):
    ESTADOS_PEDIDO = [
        ('nuevo', 'Nuevo'),
        ('pendiente', 'Pendiente'),
        ('enviado_a_cocina', 'Enviado a Cocina'),
        ('listo', 'Listo'),
        ('entregado', 'Entregado'),
        ('terminado', 'Terminado'),
    ]

    nombre_cliente = models.CharField(max_length=100)
    personas = models.IntegerField(default=1)
    fecha = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estado = models.CharField(max_length=20, choices=ESTADOS_PEDIDO, default='nuevo')
    mesa = models.ForeignKey("Mesa", on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'pedido'
        managed = False


#detalle pedido
class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles')
    platillo = models.ForeignKey(Platillo, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'detalle_pedido'
        managed = False          #Tabla ya existente

    def __str__(self):
        return f"{self.platillo.nombre} x {self.cantidad}"


#Usuario personalizado
class Usuario(AbstractUser):
    rol = models.CharField(max_length=50, default='cliente')

    class Meta:
        db_table = 'prueba_usuario'   #Esta tabla se creara para la autentificación del usuario admin
        managed = True

##Modelo empleados
class Empleado(models.Model):
    ESTADOS_LABORALES = [
        ('trabajando', 'Trabajando'),
        ('vacaciones', 'De vacaciones'),
        ('licencia', 'Licencia'),
        ('despedido', 'Despedido'),
    ]

    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    username = models.CharField(max_length=50, unique=True)
    rol = models.CharField(
        max_length=50,
        choices=[
            ('Administrador', 'Administrador'),
            ('Mesero', 'Mesero'),
            ('Cocinero', 'Cocinero'),
        ]
    )
    password = models.CharField(max_length=128)  # Contraseña cifrada
    fecha_ingreso = models.DateField(auto_now_add=True)
    activo = models.BooleanField(default=True)

    estado_laboral = models.CharField(
        max_length=20,
        choices=ESTADOS_LABORALES,
        default='trabajando'
    )

    class Meta:
        db_table = 'empleados'
        managed = False  #Evita que Django intente crear/modificar la tabla (si ya existe en Supabase)

    def __str__(self):
        return f"{self.nombre} ({self.rol})"

    #Guarda la contraseña cifrada automáticamente
    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    #Verifica la contraseña ingresada con la cifrada
    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
    
#Modelo de mesa
class Mesa(models.Model):
    id = models.AutoField(primary_key=True)
    numero = models.IntegerField()
    estado = models.CharField(max_length=20)
    capacidad = models.IntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    pin = models.CharField(max_length=4, null=True, blank=True)
    class Meta:
        db_table = 'mesas'
        managed = False

    def __str__(self):
        return f"Mesa {self.numero}"