from django.shortcuts import render
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, renderer_classes
from django.http import QueryDict
from django.db import IntegrityError
from .serializers import ListSerializer
from .models import Lists
from boards.views import get_board
from django.db import transaction
import logging

# Load the logger
logger = logging.getLogger('finalproject.logger')

# API Building
"""
Views for lists-route
"""
def get_list(board, id):
    try:
        list = Lists.objects.get(board=board, id=id)
        return list
    except Lists.DoesNotExist:
        return None

@api_view(['GET', 'POST', 'PATCH'])
@renderer_classes([JSONRenderer])
def lists(request, slug):
    board, is_member, is_admin = get_board(request.user, slug)

    if not board:
        return Response({"detail": "Board does not exist."}, status=status.HTTP_404_NOT_FOUND)
    
    if board.visibility.lower() == 'private' and not is_member:
        return Response({'detail': 'This board is private.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'GET':
        lists = list(board.lists.all())
        serializer = ListSerializer(lists, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    if request.method == 'POST':
        if not is_member:
            return Response({'detail': 'You are not a member of this board.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        list_data = request.data
        list_data['board'] = board.id
        list_data['position'] = len(board.lists.all())
        serializer = ListSerializer(data = list_data)

        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError as e:
                logger
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    if request.method == 'PATCH':
        if not request.user.is_authenticated:
            return Response({'detail': 'You need to be logged in to perform this action.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not is_member:
            return Response({'detail': 'You are not a member of this board.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if 'positions' in request.data:
            to_be_updated = request.data['positions']

        try: 
            for id in to_be_updated:
                Lists.objects.filter(pk=id).update(position=to_be_updated[id])
            return Response({'detail': 'List updated successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except IntegrityError:
            return Response({'detail': 'Something weng wrong while processing your request.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
          
@transaction.atomic
@api_view(['GET', 'PUT', 'DELETE'])
@renderer_classes([JSONRenderer])
def list_transactions(request, slug, id):
    if not request.user.is_authenticated:
        return Response({'detail': 'You need to be logged in to perform this action.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    board, is_member, is_admin = get_board(request.user, slug)
    list = get_list(board, id)

    if not board:
        return Response({'detail': 'Board does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    if not list:
        return Response({'detail': 'List does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    if not is_member:
        return Response({'detail': 'You are not a member of this of this board.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'GET':      
        serializer = ListSerializer(list)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    if request.method == 'PUT':
        list_data = request.data
        list_data['board'] = board.id
        list_data['id'] = id
        serializer = ListSerializer(list, data = list_data)

        if 'title' not in request.data:
            list_data['title'] = list.title


        if serializer.is_valid():
            serializer.save()
            return Response({'detail': 'List updated successfully.'}, status=status.HTTP_204_NO_CONTENT)
        return Response({'detail': 'Invalid request parameters.'}, status=status.HTTP_400_BAD_REQUEST)

    '''
    Soft-deletion / Archive
    '''

    if request.method == 'DELETE':
        if is_admin:
            try:
                list.delete()
                logger.info(f'{request.user.username} deleted the list with title {list.title}.')
                return Response({'detail': 'The list was successfully deleted.'}, status=status.HTTP_204_NO_CONTENT)
            except IntegrityError as e:
                logger.error(e)
                return Response({'detail': 'Something weng wrong while processing your request.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({'detail': 'You are not an administrator of this board.'}, status=status.HTTP_401_UNAUTHORIZED) 
    

    

