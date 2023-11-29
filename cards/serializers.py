from rest_framework import serializers
from .models import Cards, Labels, Updates

class UpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Updates
        fields = ['detail', 'date_updated']
        read_only_fields = ['details', 'date_updated']


class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Labels
        fields = ['id', 'color', 'title', 'card']


class CardSerializer(serializers.ModelSerializer):
    labels = LabelSerializer(many=True, read_only=True)
    updates = UpdateSerializer(many=True, read_only=True)

    class Meta:
        model = Cards
        fields = ['id', 'title', 'description', 'due', 'board', 'creator', 'members', 'position', 'list', 'labels', 'updates']
