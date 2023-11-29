from django.contrib import admin
from .models import Boards, BoardAdministratorship, BoardMembership
# Register your models here.


admin.site.register(Boards)
admin.site.register(BoardAdministratorship)
admin.site.register(BoardMembership)
