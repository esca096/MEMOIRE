
from django.contrib import admin
from django.urls import path, include, re_path
from api.views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from django.conf.urls.static import static
from django.conf import settings

from rest_framework.routers import DefaultRouter


from django.conf.urls.static import static
from django.views.static import serve 

# =============================================================================
# ROUTER POUR LES VIEWSETS
# =============================================================================
# Le DefaultRouter de Django REST framework génère automatiquement les URLs
# pour les ViewSets (CRUD complet)
router = DefaultRouter()
router.register(r'reviews', ReviewViewSet)  # CRUD complet pour les avis

# =============================================================================
# CONFIGURATION DES URLS PRINCIPALES
# =============================================================================
urlpatterns = [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),  # Servir les fichiers média en développement
    # -------------------------------------------------------------------------
    # ADMINISTRATION
    # -------------------------------------------------------------------------
    path('admin/', admin.site.urls),  # Interface d'administration Django
    
    # -------------------------------------------------------------------------
    # AUTHENTIFICATION UTILISATEUR
    # -------------------------------------------------------------------------
    path('api/user/register/', UserCreateView.as_view(), name='user_create'),  # Création de compte
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),  # Obtention JWT
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # Rafraîchissement JWT
    path('api-auth/', include('rest_framework.urls')),  # Authentification REST framework
    
    # -------------------------------------------------------------------------
    # AUTHENTIFICATION SOCIALE (AllAuth)
    # -------------------------------------------------------------------------
    path('accounts/', include('allauth.urls')),  # URLs AllAuth pour OAuth
    path('callback/', google_login_callback, name='callback'),  # Callback Google OAuth
    path('api/google/validate_token/', validate_google_token, name='validate_google_token'),  # Validation token Google
    
    # -------------------------------------------------------------------------
    # PROFIL UTILISATEUR
    # -------------------------------------------------------------------------
    path('api/auth/user/', UserDetailView.as_view(), name='user_detail'),  # Détails du profil utilisateur
    path('dashboard/', UserDashboardView.as_view(), name='user_dashboard'),  # Tableau de bord utilisateur
    
    # -------------------------------------------------------------------------
    # GESTION DES PRODUITS
    # -------------------------------------------------------------------------
    path('products/', ProductView.as_view(), name='product_list'),  # Liste produits (vue publique)
    path('api/products/', AdminProductView.as_view(), name='admin_product'),  # Gestion produits admin (CREATE)
    path('api/products/<int:pk>/', AdminEditProductView.as_view(), name='admin_product_detail'),  # Édition produit admin (UPDATE/DELETE)
    
    # -------------------------------------------------------------------------
    # PANIER D'ACHAT
    # -------------------------------------------------------------------------
    path('api/cart/', CartView.as_view(), name='cart'),  # Gestion du panier
    
    # -------------------------------------------------------------------------
    # GESTION DES COMMANDES
    # -------------------------------------------------------------------------
    # Vue admin pour voir toutes les commandes
    path('api/admin_view_orders/', AdminOrderView.as_view(), name='admin_view_orders'),
    # Vue utilisateur pour une commande spécifique
    path('api/orders/<int:pk>/', UserOrderView.as_view(), name='user_view_orders'),
    # Création d'une nouvelle commande
    path('api/orders/new/', UserOrderCreateView.as_view(), name='user-create'),
    # Liste des commandes de l'utilisateur
    path('api/user_view_orders/', UserOrderListView.as_view(), name='user_view_orders'),
    
    # -------------------------------------------------------------------------
    # PAIEMENTS
    # -------------------------------------------------------------------------
    # Création d'un intent de paiement pour Stripe
    path('api/orders/<int:order_id>/create_payment_intent', create_payment_intent, name='create_payment_intent'),
    # Marquage d'une commande comme payée
    path('api/orders/<int:order_id>/mark_paid/', mark_order_paid, name='mark_order_paid'),
    
    # -------------------------------------------------------------------------
    # AVIS ET RECOMMANDATIONS
    # -------------------------------------------------------------------------
    # Liste des avis pour un produit spécifique
    path('products/<int:product_id>/reviews/', ProductReviewList.as_view(), name='product_reviews'),
    # Système de recommandation de produits
    path('api/products/<int:product_id>/recommendations/', ProductRecommendations.as_view(), name='product_recommendations'),
    # Système de recommandation utilisant TF-IDF
    path('api/products/<int:product_id>/recommendations_tfidf/', TFIDFRecommendations.as_view(), name='product_recommendations_tfidf'),
    
    # -------------------------------------------------------------------------
    # INCLUSION DES URLS DU ROUTER (VIEWSETS)
    # -------------------------------------------------------------------------
    # Inclut toutes les URLs générées par le router pour les ViewSets
    # Cela ajoute automatiquement les routes pour /reviews/ (GET, POST)
    # et /reviews/{id}/ (GET, PUT, PATCH, DELETE)
    path('', include(router.urls)),

    # =============================================================================
    # PAIEMENTS IPAYMONEY
    # =============================================================================
    path('api/ipaymoney/callback/', ipaymoney_callback, name='ipaymoney_callback'),
    path('api/orders/<int:order_id>/verify_ipaymoney/', verify_ipaymoney_payment, name='verify_ipaymoney'),

]

# =============================================================================
# CONFIGURATION POUR LE DÉVELOPPEMENT
# =============================================================================
# En mode DEBUG, sert les fichiers média directement depuis le système de fichiers
# Cela permet d'accéder aux images/uploads pendant le développement
# En production, cette configuration ne sera pas active (DEBUG=False)
# et les fichiers média devront être servis par le serveur web (Nginx, Apache, etc.)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
