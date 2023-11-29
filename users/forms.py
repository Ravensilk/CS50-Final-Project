from django.contrib.auth.forms import AuthenticationForm
from django.core.exceptions import ValidationError

from django.contrib.auth.views import PasswordChangeView
from django.contrib.messages.views import SuccessMessageMixin

# Form Classes
class CustomLoginForm(AuthenticationForm):
    def confirm_login_allowed(self, user):
        if not user.is_active:
            raise ValidationError("You need to verify your account to login. Check your email!")
        
class NewPasswordChangeView(SuccessMessageMixin, PasswordChangeView):
    success_url = '/profile/'
    success_message = 'Your password was changed successfully! '