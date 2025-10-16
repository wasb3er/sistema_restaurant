from django.test import TestCase
from django.urls import reverse

class IndexViewTest(TestCase):
    def test_index_page_status_code(self):
        response = self.client.get(reverse('index'))  #nombre de la vista en urls.py
        self.assertEqual(response.status_code, 200)

    def test_index_page_contains_text(self):
        response = self.client.get(reverse('index'))
        self.assertContains(response, "Ordena Aquí")  #verifica que aparezca ese texto
