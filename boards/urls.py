from django.urls import path

from . import views

urlpatterns = [
    path('user/dashboard/', views.dashboard, name="dashboard"),
    path('board/', views.board, name='board-create-route'),
    path('board/<str:slug>/', views.board_get, name='show-board-route'), 
    path('board/<str:slug>/edit/', views.board_transactions, name='board-transactions-route'),
    path('board/<str:slug>/edit/change-background/', views.board_change_background, name='board-change-background-route'), 
    path('board/<str:slug>/members/', views.board_members, name='show-board-members-route'), 
    path('board/<str:slug>/members/invite/', views.board_invite, name='board-member-invite-route'),
    path('board/<str:slug>/members/<int:memberID>/remove/', views.board_member_remove, name='board-member-remove-route'),
    path('board/<str:slug>/members/add-admin/<int:memberID>/', views.board_add_admin, name='board-admin-add-route'),
    path('board/<str:slug>/members/remove-admin/<int:memberID>/', views.board_remove_admin, name='board-admin-remove-route'),
    path('render/<str:slug>/', views.board_render, name='render-board')
]