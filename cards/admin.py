from django.contrib import admin
from .models import Cards, Labels, Updates

# Register your models here.
admin.site.register(Cards)
admin.site.register(Labels)
admin.site.register(Updates)