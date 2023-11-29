from django.db import models
from users.models import User
from boards.models import Boards
from lists.models import Lists
from django.utils.timezone import now

class Updates(models.Model):
    updater = models.ForeignKey(User, on_delete=models.CASCADE, null=False, blank=False)
    detail = models.TextField(null=False, blank=False)
    date_updated = models.DateTimeField(null=False, blank=False, default=now)

class Cards(models.Model):
    title = models.CharField(max_length=256, null = False, blank = False)
    description = models.TextField(null=True, blank=True)
    board = models.ForeignKey(Boards, on_delete=models.CASCADE, related_name='board_cards')
    due = models.DateTimeField(null=True, blank=True)
    list = models.ForeignKey(Lists, on_delete=models.CASCADE, related_name='list_cards')
    position = models.IntegerField(null=False, blank=False, default=1)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_cards')
    members = models.ManyToManyField(User, related_name='joined_cards')
    updates = models.ManyToManyField(Updates, related_name='card_updates')
    archived = models.BooleanField(default=False)
    date_created = models.DateTimeField(null=False, blank=False, default=now)
    
class Labels(models.Model):
    color = models.CharField(max_length=10, null=False, blank=False, default='#ffffb5')
    title = models.CharField(max_length=256, null = True, blank = True)
    card = models.ForeignKey(Cards, on_delete=models.CASCADE, related_name='labels')
    