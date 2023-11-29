from .models import Lists
from rest_framework import serializers

class ListSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Lists
        fields = ['id', 'title', 'position', 'board']
