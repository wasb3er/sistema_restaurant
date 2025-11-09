from django.test import TestCase
from django.urls import reverse
from unittest.mock import patch
from django.http import JsonResponse
import json

class IndexViewTest(TestCase):
    def test_index_page_status_code(self):
        response = self.client.get(reverse('index'))
        self.assertEqual(response.status_code, 200)

    def test_index_page_contains_text(self):
        response = self.client.get(reverse('index'))
        self.assertContains(response, "Ordena Aquí")
    #reemplaza temporalmente el modelo en la vista
    @patch("prueba.views.Platillo")  
    def test_menu_page_lists_platillos(self, MockPlatillo):
        #Configuramos el mock para simular datos
        mock_platillo = type("MockPlatillo", (), {
            "nombre": "Pizza Margarita",
            "descripcion": "Queso y tomate",
            "precio": 8000,
            "cantidad": 5
        })()
        #finge el queryset
        MockPlatillo.objects.all.return_value = [mock_platillo]  

        response = self.client.get(reverse('menu'))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Pizza Margarita")

    @patch("prueba.views.Pedido")
    @patch("prueba.views.Platillo")
    @patch("prueba.views.DetallePedido")
    def test_crear_pedido_post(self, MockDetallePedido, MockPlatillo, MockPedido):
        #Simula objetos de prueba
        mock_platillo = type("MockPlatillo", (), {"id": 1, "precio": 5000, "cantidad": 10, "save": lambda self: None})()
        MockPlatillo.objects.get.return_value = mock_platillo

        mock_pedido = type("MockPedido", (), {"id": 1, "nombre_cliente": "Carlos", "total": 10000, "estado": "pendiente", "save": lambda self: None})()
        MockPedido.objects.create.return_value = mock_pedido

        url = reverse("crear_pedido")

        #Enviamos datos de lo que espera la vista
        data = {
            "nombre": "Carlos",
            "personas": 2,
            "platillos": [
                {"id": 1, "cantidad": 2}
            ]
        }

        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        content = response.content.decode()
        self.assertIn('"success": true', content)
        self.assertIn('"pedido_id"', content)