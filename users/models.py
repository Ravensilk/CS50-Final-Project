from django.db import models
from django.contrib.auth.models import AbstractUser
from django import forms
from django.contrib.auth.validators import ASCIIUsernameValidator
from django.core.validators import EmailValidator
import re

# Database Models
class User(AbstractUser):
    num_boards = models.IntegerField(null=False, blank=False, default=0)
    is_active = models.BooleanField(null=False, blank=False, default=False)
    
    def get_joined_boards(self):
        joined_boards = list(self.joined_boards.all() | self.administrated_boards.all())
        sorted_boards = sorted(set(joined_boards), key=lambda board: board.id)
        return sorted_boards
        
    def get_created_boards(self):
        return list(self.created_boards.all().order_by('id'))

class RegisterForm(forms.Form):
    username = forms.CharField(required=True, label=False, validators=[ASCIIUsernameValidator])
    email = forms.EmailField(required=True, label=False, validators=[EmailValidator])
    password = forms.CharField(widget=forms.PasswordInput, required=True, label=False)
    confirmpassword = forms.CharField(widget=forms.PasswordInput, required=True, label=False)

class LoginForm(forms.Form):
    username = forms.CharField(widget=forms.TextInput(attrs={"class": "form-control", "placeholder": "Username"}), required=True, label=False)
    password = forms.CharField(widget=forms.PasswordInput(attrs={"class": "form-control", "placeholder": "Password"}), required=True, label=False)

# Authentication Classes
class UserAuthenticator:
    def __init__(self, username, email):
        self.username = username
        self.email = email

    def check_username(self):
        return User.objects.filter(username=self.username).exists()
        
    def check_email(self):
        return User.objects.filter(email=self.email).exists()