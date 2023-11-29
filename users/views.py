# Import Dependencies
from django.shortcuts import render, redirect
from django.urls import reverse, reverse_lazy
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponseRedirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView
from .forms import CustomLoginForm
from django.db import transaction

# Import User Database Models
from .models import User

# Import User Form Models
from .models import RegisterForm

# Import User Authentication Models
from .models import UserAuthenticator

# Django Views
class CustomloginView(LoginView):
    template_name = 'users/login.html'
    authentication_form = CustomLoginForm

# Views
def index_view(request):
    if request.user.is_authenticated:
        return redirect(reverse('dashboard'))
    return render(request, 'users/index.html')


def register_view(request):
    # Check if user is not authenticated. If not, show the form.
    if not request.user.is_authenticated:
        if not request.method == "POST":
            form = RegisterForm()
            return render(request, 'users/register.html', {
                "form": form
            })
        
        form = RegisterForm(request.POST)
    
        if not form.is_valid():
            return render(request, 'users/register.html', {
                "form": form
            })
        
        data = form.cleaned_data
        registrant = UserAuthenticator(data['username'], data['email'])

        # Check if someone with the same username already exists.
        if registrant.check_username():
            messages.error(request, "This username is already taken")
            return render(request, 'users/register.html', {
                "form": form
            })
        
        # Check if someone with the same email already exists.
        if registrant.check_email():
            messages.error(request, "This email is already taken")
            return render(request, 'users/register.html', {
                "form": form
            })

        # If the submitted password and confirm passwords are not the same, return an error.
        if data['password'] != data['confirmpassword']:
            messages.error(request, "You have entered different passwords")
            return render(request, 'users/register.html', {
                "form": form
            })
        
        # Create user if no errors are raised and then redirect to login page.
        user = User.objects.create_user(username=data['username'], password=data['password'], email=data['email'], is_active=True)
        messages.success(request, "You have been successfully registered.")
        return HttpResponseRedirect(reverse('login'))
                
    else:
        return HttpResponseRedirect('/')



