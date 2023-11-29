from .models import Boards
from users.models import User
from lists.models import Lists
from cards.models import Cards, Labels
from rest_framework import serializers

class BoardLabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Labels
        fields = ['id', 'color', 'title']


class BoardCardSerializer(serializers.ModelSerializer):
    labels = BoardLabelSerializer(many=True, read_only=True)
    class Meta:
        model = Cards
        fields = ['id', 'title', 'description', 'creator', 'members', 'position', 'labels', 'due']

class BoardListSerializer(serializers.ModelSerializer):
    list_cards = BoardCardSerializer(many=True, read_only=True)
    
    class Meta:
        model = Lists
        fields = ['id', 'title', 'position', 'list_cards']

class BoardSerializer(serializers.ModelSerializer):
    lists = BoardListSerializer(many=True, read_only=True)

    class Meta:
        model = Boards
        fields = ['title', 'creator', 'slug', 'visibility', 'members', 'admins', 'background_image', 'date_created', 'lists']
        read_only_fields = ['members', 'admins', 'background_image']

class BoardMemberDataSerializer(serializers.ModelSerializer):
    
    class Meta: 
        model = User
        fields = ['id', 'email']

class BoardMembersSerializer(serializers.ModelSerializer):
    members = BoardMemberDataSerializer(many=True, read_only=True)

    class Meta:
        model = Boards
        fields = ['members']



