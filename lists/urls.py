from django.urls import path
from . import views

urlpatterns = [
    path('board/<str:slug>/lists/', views.lists, name='list-create-route'),
    path('board/<str:slug>/list/<int:id>/', views.list_transactions, name='get-list-route'),
]