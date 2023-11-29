from django.urls import path
from django.contrib.auth.views import LogoutView, PasswordResetView, PasswordResetDoneView, PasswordResetConfirmView, PasswordResetCompleteView, PasswordChangeView, PasswordChangeDoneView
from .forms import NewPasswordChangeView
from .views import CustomloginView

from . import views

urlpatterns = [
    path("", views.index_view, name="index"),
    path('register', views.register_view, name="register"),
    path('login', CustomloginView.as_view(redirect_authenticated_user = True), name="login"),
    path('reset-password', PasswordResetView.as_view(template_name="users/resetpassword.html"), name="resetpass"),
    path('reset-done', PasswordResetDoneView.as_view(template_name="users/resetdone.html"), name='password_reset_done'),
    path('reset/<uidb64>/<token>/', PasswordResetConfirmView.as_view(template_name="users/resetconfirm.html"), name='password_reset_confirm'),
    path('reset-complete/', PasswordResetCompleteView.as_view(template_name="users/resetcomplete.html"), name="password_reset_complete"),
    path('profile/', NewPasswordChangeView.as_view(template_name="users/profile.html"), name="password_change"),
    path('logout', LogoutView.as_view(), name="logout")
]