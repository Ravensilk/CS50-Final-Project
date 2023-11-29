from django.urls import path

from . import views

urlpatterns = [
    path('board/<str:slug>/list/<int:listID>/cards/', views.cards, name='cards-get-create-route'),
    path('board/<str:slug>/list/<int:listID>/card/<int:cardID>/', views.card_transactions, name='show-card-route'),
    path('board/<str:slug>/list/<int:listID>/card/<int:cardID>/updates', views.card_updates, name='show-card-updates-route'),
    path('board/<str:slug>/list/<int:listID>/card/<int:cardID>/labels/', views.labels, name='labels-get-create-route'),
    path('board/<str:slug>/list/<int:listID>/card/<int:cardID>/label/<int:labelID>/delete/', views.label_delete, name='label-delete-route')
]