from django.shortcuts import render
from django.db import transaction
from django.http import QueryDict
from django.db import IntegrityError
import logging

from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, authentication_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status

# Import Models, Functions and Serializers
from boards.views import get_board
from lists.views import get_list
from .models import Cards, Labels, Updates
from lists.models import Lists
from .serializers import CardSerializer, LabelSerializer, UpdateSerializer

# Load the logger
logger = logging.getLogger('finalproject.logger')

# Create your views here.
def get_card(board, list, id):
    try:
        card = Cards.objects.get(board=board, list=list, id=id)
        return card
    except Cards.DoesNotExist:
        return None
    
def get_board_list_card(request, slug, listID, cardID = None):
    board, is_member, is_admin = get_board(request.user, slug)
    b_list = get_list(board, listID)
    card = get_card(board, b_list, cardID)
    return board, is_member, is_admin, b_list, card

@transaction.atomic
@api_view(['GET', 'POST', 'PATCH'])
@renderer_classes([JSONRenderer])
def cards(request, slug, listID):
    board, is_member, is_admin, b_list, card = get_board_list_card(request, slug, listID)

    if not board:
        return Response({'detail': 'Board does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    if board.visibility.lower() == 'private' and not is_member:
        return Response({'detail': 'This board is private.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if not b_list:
        return Response({'detail': 'List does not exist.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        cards = list(b_list.list_cards.all())
        serializer = CardSerializer(cards, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({'detail': 'You need to be logged in to perform this action.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not is_member:
            return Response({'detail': 'You are not a member of this board.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        card_data = request.data
        card_data['board'] = board.id 
        card_data['list'] = b_list.id
        card_data['creator'] = request.user.id
        card_data['members'] = [request.user.id]
        card_data['position'] = len(b_list.list_cards.all())

        serializer = CardSerializer(data = card_data)

        if serializer.is_valid():
            logger.info(f'{request.user.username} added a card to board {board.title} under list {b_list.title} titled {serializer.validated_data["title"]}.')
            card = serializer.save()
            update_detail = f"Card was created by {request.user.username}."
            card_update = Updates.objects.create(updater=request.user, detail=update_detail)
            card.updates.add(card_update)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.info(f'{request.user.username} failed to add a card to board {board.title}.')
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
                Cards.objects.filter(pk=id).update(position=to_be_updated[id])
            return Response({'detail': 'Card updated successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except IntegrityError as e:
            print(e)
            return Response({'detail': 'Something weng wrong while processing your request.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 
@transaction.atomic
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@renderer_classes([JSONRenderer])
def card_transactions(request, slug, listID, cardID):
    board, is_member, is_admin, b_list, card = get_board_list_card(request, slug, listID, cardID)

    if not board:
        return Response({'detail': 'Board does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    if board.visibility.lower() == 'private' and not is_member:
        return Response({'detail': 'This board is private.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if not b_list:
        return Response({'detail': 'List does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    if not card:
        return Response({'detail': 'Card does not exist.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = CardSerializer(card)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    if request.method == 'PUT':
        if not request.user.is_authenticated:
            return Response({'detail': 'You need to be logged in to perform this action.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not is_member:
            return Response({'detail': 'You are not a member of this board.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        card_data = request.data

        card_data['id'] = card.id
        card_data['board'] = card.board.id
        card_data['creator'] = card.creator.id
        card_data['members'] = [i.id for i in card.members.all()]
        
        if 'title' not in request.data:
            card_data['title'] = card.title
        else:
            update_detail = f"The card's title was updated by {request.user.username}."

        if 'description' not in request.data:
            card_data['description'] = card.description
        else:
            update_detail = f"The card's description was updated by {request.user.username}."

        if 'due' in request.data:
            update_detail = f"The card's due date was updated by {request.user.username}."

        if 'list' not in request.data:
            card_data['list'] = card.list.id
        else: 
            update_detail = f"The card's position was updated by {request.user.username} from the list {b_list.title} to {Lists.objects.get(id=card_data['list']).title}."

        serializer = CardSerializer(card, data = card_data)

        if serializer.is_valid():
            serializer.save()
            card_update = Updates.objects.create(updater=request.user, detail=update_detail)
            card.updates.add(card_update)
            return Response(serializer.data, status=status.HTTP_202_ACCEPTED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    if request.method == 'DELETE':

        if not request.user.is_authenticated:
            return Response({'detail': 'You need to be logged in to perform this action.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not is_admin and not card.creator == request.user:
            return Response({'detail': 'You are not an administrator of this board or the one who created the card.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            card.delete()
            logger.info(f'{request.user.username} deleted the card with title {card.title}.')
            return Response({'detail': 'The card was successfully deleted.'}, status=status.HTTP_204_NO_CONTENT)
        except IntegrityError as e:
            logger.error(e)
            return Response({'detail': 'Something weng wrong while processing your request.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
  
@transaction.atomic
@api_view(['GET'])
@renderer_classes([JSONRenderer])
def card_updates(request, slug, listID, cardID):
    board, is_member, is_admin, b_list, card = get_board_list_card(request, slug, listID, cardID)

    if not board:
        return Response({'detail': 'Board does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    if board.visibility.lower() == 'private' and not is_member:
        return Response({'detail': 'This board is private.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if not b_list:
        return Response({'detail': 'List does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    if not card:
        return Response({'detail': 'Card does not exist.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = UpdateSerializer(card.updates.all(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@transaction.atomic
@api_view(['GET', 'POST'])
@renderer_classes([JSONRenderer])
def labels(request, slug, listID, cardID):
    board, is_member, is_admin, b_list, card = get_board_list_card(request, slug, listID, cardID)

    if not board:
        return Response({'detail': 'Board does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    if board.visibility.lower() == 'private' and not is_member:
        return Response({'detail': 'This board is private.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if not b_list:
        return Response({'detail': 'List does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    if not card:
        return Response({'detail': 'Card does not exist.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        labels = list(card.labels.all())
        serializer = LabelSerializer(labels, many = True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({'detail': 'You need to be logged in to perform this action.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not is_member:
            return Response({'detail': 'You are not a member of this board.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        label_data = request.data
        label_data['card'] = card.id
        serializer = LabelSerializer(data = label_data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    
@api_view(['DELETE'])
@renderer_classes([JSONRenderer])
def label_delete(request, slug, listID, cardID, labelID):
    board, is_member, is_admin, b_list, card = get_board_list_card(request, slug, listID, cardID)
    label = Labels.objects.get(pk=labelID)

    if not board:
        return Response({'detail': 'Board does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    if board.visibility.lower() == 'private' and not is_member:
        return Response({'detail': 'This board is private.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if not b_list:
        return Response({'detail': 'List does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    if not card:
        return Response({'detail': 'Card does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    if not label:
        return Response({'detail': 'Label does not exist.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        label.delete()
        return Response({'detail': 'The label was successfully deleted.'}, status=status.HTTP_204_NO_CONTENT)
    return Response({'detail': 'Something weng wrong while processing your request.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)