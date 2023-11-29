# Import dependencies
from django.shortcuts import render
from django.urls import reverse
from django.db import IntegrityError
from django.contrib.auth.decorators import login_required
from django.utils.text import slugify
from django.db import transaction
from django.core.validators import validate_email, FileExtensionValidator
from django.core.exceptions import ValidationError
from django.http import QueryDict
from PIL import Image
from rest_framework.decorators import api_view, renderer_classes
from rest_framework import status
from rest_framework.renderers import JSONRenderer, TemplateHTMLRenderer
from rest_framework.response import Response
import os


import logging

# Import Serializers
from .serializers import BoardSerializer, BoardMembersSerializer

# Import Board Database Models
from .models import Boards
from users.models import User

# Load the logger
logger = logging.getLogger('finalproject.logger')

# Views
@login_required
def dashboard(request):
    
    try:
        user = User.objects.get(pk=request.user.id)
        joined_boards = user.get_joined_boards()
        created_boards = user.get_created_boards()
        return render(request, 'boards/dashboard.html', {
            'joined_boards': joined_boards, 'created_boards': created_boards
    })
    except User.DoesNotExist:
        return render(request, 'boards/error.html')

# API Building
"""
New try on building an API for creating, updating and deleting boards.

"""
def get_board(user, slug):
    try:
        board = Boards.objects.get(slug=slug)
        member = True if user in board.get_members() else False
        admin = True if user in board.get_administrators() else False
        return board, member, admin
    except Boards.DoesNotExist:
        return None, None, None

@transaction.atomic
@api_view(['POST'])
@renderer_classes([JSONRenderer])
def board(request):
    if not request.user.is_authenticated:
        return Response({'detail': 'You need to be logged in to perform this action.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'POST':
        try:
            if request.data['title']:
                existing_board = Boards.objects.filter(title=request.data['title']).first()
                existing_slug = Boards.objects.filter(slug=slugify(request.data['title'])).first()

                if existing_board or existing_slug:
                    return Response({"detail": "A board that has the same title already exists. Pick another one!"}, status=status.HTTP_403_FORBIDDEN)

                board_data = request.data
                board_data['slug'] = slugify(board_data['title'])
                board_data['creator'] = request.user.id
                serializer = BoardSerializer(data = board_data)

                if serializer.is_valid():
                    logger.info(f'{serializer.validated_data["creator"]} made a board named {serializer.validated_data["title"]} successfully.')
                    serializer.save()
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                logger.error(f'{serializer.validated_data["creator"]} failed to create a board.')
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({'detail': 'Invalid request parameters.'}, status=status.HTTP_400_BAD_REQUEST)
        
        except IntegrityError as e:
            logger.error(e)
            return Response({'detail': 'Something weng wrong while processing your request.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        except Exception as e:
            print(e)
            logger.error(e)
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@renderer_classes([TemplateHTMLRenderer])
def board_render(request, slug):
    if not request.user.is_authenticated:
        return Response({'error_message': 'You need to be logged in to perform this action.'}, template_name='boards/error.html')
    
    board, is_member, is_admin = get_board(request.user, slug)

    if not board:
        return Response({'error_message': 'Board does not exist.'}, template_name='boards/error.html')
    
    if board.visibility.lower() == 'private' and not is_member:
        return Response({'error_message': 'This board is private.'}, template_name='boards/error.html')
    
    if board.archived and not is_admin:
        return Response({'error_message': 'This board is archived. Ask the creator to un-archive if you want to view it.'}, template_name='boards/error.html')
    
    if request.method == 'GET':
        id = board.id
        title = board.title
        slug = board.slug
        admin = is_admin
        if is_member:
            return Response({'board': board, 'id': id, 'slug': slug, 'title': title, 'admin': admin}, template_name='boards/board.html')
        return Response({'error_message': 'You are not a member of this board!'}, template_name='boards/error.html')
  

@api_view(['GET'])
@renderer_classes([JSONRenderer])
def board_get(request, slug):
    if not request.user.is_authenticated:
        return Response({'detail': 'You need to be logged in to perform this action.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    board, is_member, is_admin = get_board(request.user, slug)

    if not board:
        return Response({'detail': 'Board does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    if board.visibility.lower() == 'private' and not is_member:
        return Response({'detail': 'This board is private.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if board.archived and not is_admin:
        return Response({'detail': 'This board is archived. Ask the creator to un-archive if you want to view it.'}, status=status.HTTP_409_CONFLICT)
    
    if request.method == 'GET':

        if is_member:
            serializer = BoardSerializer(board)
            response_object = serializer.data
            response_object['is_admin'] = is_admin
            response_object['is_creator'] = True if request.user == board.creator else False
            print(response_object['is_creator'])
            return Response(response_object, status=status.HTTP_200_OK)
        return Response({'detail': 'You are not a member of this board!'}, status=status.HTTP_401_UNAUTHORIZED)
    

@api_view(['GET'])
@transaction.atomic
@renderer_classes([JSONRenderer])
def board_members(request, slug):

    if not request.user.is_authenticated:
        return Response({'detail': 'You need to be logged in to perform this action.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    board, is_member, is_admin = get_board(request.user, slug)

    if not board:
        return Response({'detail': 'Board does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    if board.visibility.lower() == 'private' and not is_member:
        return Response({'detail': 'This board is private.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if board.archived and not is_admin:
        return Response({'detail': 'This board is archived. Ask the creator to un-archive if you want to view it.'}, status=status.HTTP_409_CONFLICT)
    
    if request.method == 'GET':
        if is_admin or is_member:
            serializer = BoardMembersSerializer(board)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({'detail': 'You are not an administrator of this board!'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['PUT', 'PATCH', 'DELETE'])
@transaction.atomic
@renderer_classes([JSONRenderer])
def board_transactions(request, slug):

    if not request.user.is_authenticated:
        return Response({'detail': 'You need to be logged in to perform this action.'}, status=status.HTTP_401_UNAUTHORIZED)

    board, is_member, is_admin = get_board(request.user, slug)

    if not board:
        return Response({'detail': 'Board does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    if board.visibility.lower() == 'private' and not is_member:
        return Response({'detail': 'This board is private.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'PUT':
        if is_admin:
            try:    
                board_data = request.data

                if 'title' not in request.data:
                    board_data['title'] = board.title

                if 'visibility' not in request.data:
                    board_data['visibility'] = board.visibility

                board_data['slug'] = slugify(board_data['title'])
                board_data['creator'] = board.creator.id
                board_data['date_created'] = board.date_created
                serializer = BoardSerializer(board, data = board_data)
            
                if serializer.is_valid():
                    if board.title == serializer.validated_data['title']:
                        logger.info(f'{board.creator.username} changed the name of Board ID {board.id}.')
                    if board.visibility != serializer.validated_data['visibility']:
                        logger.info(f'{board.creator.username} changed the visibility of Board ID {board.id}.')
                    serializer.save()
                    return Response(serializer.data, status=status.HTTP_202_ACCEPTED)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            except IntegrityError as e:
                logger.error(e)
                return Response({'detail': 'Something weng wrong while processing your request.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    ''' 
    Soft-delete / Archive
    '''
    if request.method == 'DELETE':
        if is_admin:
            try:
                if (board.archived):
                    board.archived = False
                else:
                    board.archived = True
                board.save()
                logger.info(f'{board.creator.username} Un/archived the board with ID {board.id}.')
                return Response({'detail': 'The board was successfully un/archived.'}, status=status.HTTP_204_NO_CONTENT)
            except IntegrityError as e:
                logger.error(e)
                return Response({'detail': 'Something weng wrong while processing your request.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({'detail': 'You are not an administrator of this board.'}, status=status.HTTP_401_UNAUTHORIZED) 

@transaction.atomic   
@api_view(['POST', 'DELETE'])
@renderer_classes([JSONRenderer]) 
def board_change_background(request, slug):
    
    if not request.user.is_authenticated:
        return Response({'detail': 'You need to be logged in to perform this action.'}, status=status.HTTP_401_UNAUTHORIZED)

    board, is_member, is_admin = get_board(request.user, slug)

    if not board:
        return Response({'detail': 'Board does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    if board.visibility.lower() == 'private' and not is_member:
        return Response({'detail': 'This board is private.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'POST':
            
        newImage = request.FILES['background-image']

        try:
            img = Image.open(newImage)
            image_format = img.format
            if image_format not in ['JPEG', 'JPG', 'PNG', 'WEBP']:
                return Response({'detail': 'Invalid file type. Only JPEG, PNG and WEBP are accepted.'}, status=status.HTTP_406_NOT_ACCEPTABLE)

            max_size = 10 * 1024 * 1024
            if newImage.size > max_size:
                return Response({'detail': 'Invalid image size. You can only upload up to a maximum of 5MB.'}, status=status.HTTP_406_NOT_ACCEPTABLE)
            
            if board.background_image: 
                dir = os.listdir(f'boards/static/boards/images/{slug}/')
                if len(dir) > 0:
                    os.remove(f'boards/static/boards/images/{board.background_image}')

            board.background_image = newImage
            board.save()
            return Response({'detail': 'Background updated successfully!'}, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            return Response({'detail': e}, status=status.HTTP_406_NOT_ACCEPTABLE)

        
    if request.method == 'DELETE':
        
        if not is_admin:
            return Response({'detail': 'You are not an administrator of this board!'}, status=status.HTTP_401_UNAUTHORIZED)

        if board.background_image is not None:
            dir = os.listdir(f'boards/static/boards/images/{slug}/')
            if len(dir) > 0:
                os.remove(f'boards/static/boards/images/{board.background_image}')
            board.background_image = None
            board.save()
            return Response({'detail': 'The background of the board was successfully removed!'}, status=status.HTTP_204_NO_CONTENT)      

@transaction.atomic
@api_view(['POST'])
@renderer_classes([JSONRenderer])
def board_invite(request, slug):

    if not request.user.is_authenticated:
        return Response({'detail': 'You need to be logged in to perform this action.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    board, is_member, is_admin = get_board(request.user, slug)

    if request.method == "POST":
        
        member_email = request.data['email']

        try:
            validate_email(member_email)
        except ValidationError as e:
            return Response({'detail': 'Invalid email provided!'}, status=status.HTTP_406_NOT_ACCEPTABLE)

        board_members = board.get_members()
        
        if not is_admin:
            return Response({'detail': 'You are not allowed to invite new members into this board.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            invitee = User.objects.get(email=member_email)
        except User.DoesNotExist:
            return Response({'detail': 'This email is not yet registered. Invite them to register!'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        if invitee in board_members:
            return Response({'detail': 'This member is already a member of this board!'}, status=status.HTTP_409_CONFLICT)

        try:
            board.add_member(invitee)
            return Response({'detail': f'Member with email {invitee.email} has been invited successfully!'}, status=status.HTTP_202_ACCEPTED)
        except IntegrityError as e:
            logger.error(e)
            return Response({'detail': 'Something weng wrong while processing your request.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

@transaction.atomic
@api_view(['DELETE'])
@renderer_classes([JSONRenderer])
def board_member_remove(request, slug, memberID):

    if not request.user.is_authenticated:
        return Response({'detail': 'You need to be logged in to perform this action.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    board, is_member, is_admin = get_board(request.user, slug)

    if request.method == "DELETE":
        
        if not is_admin:
            if request.user.id != memberID:
                return Response({'detail': 'You are not allowed to invite new members into this board.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            member = User.objects.get(id=memberID)
        except User.DoesNotExist:
             return Response({'detail': 'This member does not exist.'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        
        board_administrators = board.get_administrators()
        
        board_members = list(board.members.all())

        if member not in board_members:
            return Response({'detail': 'This user is not a member of this board.'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        try:
            board.members.remove(member)
            if member in board_administrators:
                board.admins.remove(member)
            return Response({'detail': 'The member was successfully removed from the board!'}, status=status.HTTP_202_ACCEPTED)
        except IntegrityError:
            return Response({'detail': 'Something weng wrong while processing your request.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@transaction.atomic
@api_view(['PUT'])
@renderer_classes([JSONRenderer])
def board_add_admin(request, slug, memberID):

    if not request.user.is_authenticated:
        return Response({'detail': 'You need to be logged in to perform this action.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    board, is_member, is_admin = get_board(request.user, slug)

    if request.method == "PUT":
        
        if not is_admin:
            return Response({'detail': 'You are not allowed to invite new members into this board.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            member = User.objects.get(id=memberID)
        except User.DoesNotExist:
             return Response({'detail': 'This member does not exist.'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        board_members = list(board.members.all())

        if member not in board_members:
            return Response({'detail': 'This user is not a member of this board.'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        board_administrators = board.get_administrators()

        if member not in board_administrators:
            try:
                board.admins.add(member)
                return Response({'detail': 'The member was successfully added to the board administrators group.'}, status=status.HTTP_202_ACCEPTED)
            except IntegrityError:
                return Response({'detail': 'Something weng wrong while processing your request.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            
@transaction.atomic
@api_view(['DELETE'])
@renderer_classes([JSONRenderer])
def board_remove_admin(request, slug, memberID):

    if not request.user.is_authenticated:
        return Response({'detail': 'You need to be logged in to perform this action.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    board, is_member, is_admin = get_board(request.user, slug)

    if request.method == "DELETE":
        
        try:
            member = User.objects.get(id=memberID)
        except User.DoesNotExist:
             return Response({'detail': 'This member does not exist.'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        board_members = list(board.members.all())

        if member not in board_members:
            return Response({'detail': 'This user is not a member of this board.'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        board_administrators = board.get_administrators()

        if member in board_administrators:
            try:
                board.admins.remove(member)
                return Response({'detail': 'The member was successfully removed from the board administrators group.'}, status=status.HTTP_202_ACCEPTED)
            except IntegrityError:
                return Response({'detail': 'Something weng wrong while processing your request.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)