from django.test import TestCase
from .models import RegisterForm, LoginForm, User
from .views import register_view, login_view

# Create your tests here.

class RegisterTestCase(TestCase):

    def test_register_invalid_email(self):
        data = {
            "username": "Ravensilk",
            "email": "12341534534",
            "password": "password1234",
            "confirmpassword": "password1234"
        }
        form = RegisterForm(data=data)
        self.assertFalse(form.is_valid())

    def test_register_invalid_incomplete(self):
        data = {
            "username": "Ravensilk",
            "email": "janjancabrera89@gmail.com",
            "password": "password1234",
            "confirmpassword": ""
        }
        form = RegisterForm(data=data)
        self.assertFalse(form.is_valid())

    def test_register_invalid_inject(self):
        data = {
            "username": "<script>alert('hello!')!</script>",
            "email": "janjancabrera89@gmail.com",
            "password": "password1234",
            "confirmpassword": "password1234"
        }
        form = RegisterForm(data=data)
        self.assertFalse(form.is_valid())

class LoginTest(TestCase):

    def test_incomplete_fields(self):
        data = {
            "username": "",
            "password": "password1234"
        }
        form = LoginForm(data=data)
        self.assertFalse(form.is_valid())

    def test_incomplete_fields2(self):
        data = {
            "username": "Ravensilk",
            "password": ""
        }
        form = LoginForm(data=data)
        self.assertFalse(form.is_valid())

class TestRegisterRequest(TestCase):

    def setUp(self):
        User.objects.create_user(username="Ravensilk", password="password12345", email="testemail@gmail.com")

    def test_register_invalid_email(self):
        data = {
            "username": "Crocodile",
            "email": "testemail@gmail.com",
            "password": "password1234",
            "confirmpassword": "password1234"
        }

        response = self.client.post('/register', data=data)
        self.assertContains(response, "This email is already taken")

    def test_register_invalid_username(self):
        data = {
            "username": "Ravensilk",
            "email": "tryandtry@gmail.com",
            "password": "password1234",
            "confirmpassword": "password1234"
        }

        response = self.client.post('/register', data=data)
        self.assertContains(response, "This username is already taken")

    def test_register_different_passwords(self):
        data = {
            "username": "Crocodile",
            "email": "tryandtry@gmail.com",
            "password": "password1234",
            "confirmpassword": "password123456788"
        }

        response = self.client.post('/register', data=data)
        self.assertContains(response, "You have entered different passwords")

    def test_register_missing_values(self):
        data = {
            "username": "Crocodile",
            "email": "",
            "password": "password1234",
            "confirmpassword": "password1234"
        }

        response = self.client.post('/register', data=data)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.context['form'].errors)
        self.assertFormError

    def test_register_valid(self):
        data = {
            "username": "Crocodile",
            "email": "tryandtry@gmail.com",
            "password": "password1234",
            "confirmpassword": "password1234"
        }

        response = self.client.post('/register', data=data)
        self.assertEqual(response.status_code, 302)
        redirect_target = response.url
        redirect_response = self.client.get(redirect_target)
        self.assertContains(redirect_response, "You have been successfully registered.")
