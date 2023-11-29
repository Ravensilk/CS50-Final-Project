from django.db import models
from boards.models import Boards
from django.utils.timezone import now

# Database Models
class Lists(models.Model):
    title = models.CharField(max_length=256, null=False, blank=False)
    board = models.ForeignKey(Boards, on_delete=models.CASCADE, null=False, blank=False, related_name="lists")
    position = models.IntegerField(null=False, blank=False, default = 1)
    archived = models.BooleanField(default=False)
    date_added = models.DateTimeField(null=False, blank=False, default=now)
