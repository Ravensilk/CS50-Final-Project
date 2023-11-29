from django.db import models
from django.utils.timezone import now
from users.models import User
from django.core.validators import validate_image_file_extension
from django.core.exceptions import ValidationError
import secrets
import os
import uuid

# Database Models
class Boards(models.Model):

    def board_image_path(instance, filename):
        unique_filename = uuid.uuid4().hex
        file_extension = os.path.splitext(filename)[-1]
        return os.path.join(instance.slug, f"{unique_filename}{file_extension}")

    title = models.CharField(max_length=55, null=False, blank=False)
    slug = models.CharField(max_length=100, null=False, blank=False)
    visibility = models.CharField(max_length=20, null=False, blank=False, default="Public")
    creator = models.ForeignKey(User, on_delete=models.CASCADE, null=False, related_name="created_boards")
    admins = models.ManyToManyField(User, through="BoardAdministratorship", through_fields=("board", "admin"), related_name="administrated_boards")
    members = models.ManyToManyField(User, through="BoardMembership", through_fields=("board", "member"), related_name="joined_boards")
    background_image = models.ImageField(upload_to=board_image_path, null = True, blank = True)
    token = models.CharField(max_length=256, null=True, blank=True)
    archived = models.BooleanField(default=False)
    date_created = models.DateTimeField(null=False, blank=False, default=now)
    
    def __str__(self):
        return f"{self.title.title()} - {self.creator.username}"
    
    def generate_token(self):
        safe_token = secrets.token_urlsafe()
        self.token = safe_token
        self.save()
        return self.token

    def get_members(self):
        self.complete_members = list(self.members.all() | self.admins.all())
        self.complete_members.append(self.creator)
        return self.complete_members
    
    def get_administrators(self):
        self.authorized_members = list(self.admins.all())
        self.authorized_members.append(self.creator)
        return self.authorized_members
    
    def add_admin(self, user):
        self.admins.add(user)
        self.save()

    def add_member(self, user):
        self.members.add(user)


class BoardAdministratorship(models.Model):
    board = models.ForeignKey(Boards, on_delete=models.CASCADE)
    admin = models.ForeignKey(User, on_delete=models.CASCADE)
    date_added = models.DateTimeField(null=False, blank=False, default=now)

class BoardMembership(models.Model):
    board = models.ForeignKey(Boards, on_delete=models.CASCADE)
    member = models.ForeignKey(User, on_delete=models.CASCADE)
    date_added = models.DateTimeField(null=False, blank=False, default=now)

# Form Models

