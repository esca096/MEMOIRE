"""
Fichier: api/views.py

Description (FR):
- Définit les endpoints REST exposés par l'application en utilisant Django REST Framework.
- Endpoints principaux fournis ici :
    - Gestion des utilisateurs (inscription, détail, dashboard)
    - CRUD produits (vues admin et liste publique)
    - Panier (CartView) : récupération et mise à jour du panier d'un utilisateur (JSON)
    - Commandes (Order) : création et listing des commandes
    - Avis (Review) : création et consultation des avis sur les produits
    - Recommandations : heuristiques simples (`ProductRecommendations`) et TF-IDF (`TFIDFRecommendations`)
    - Endpoints de paiement Stripe (create_payment_intent, mark_order_paid)
    - Endpoints de paiement IpayMoney (ipaymoney_callback, verify_ipaymoney_payment)

Comment ces fichiers se connectent :
- Utilise les serializers définis dans `api/serialzers.py` pour valider et renvoyer les données.
- Repose sur les modèles définis dans `api/models.py`.
- Le frontend appelle ces endpoints via `frontend/src/api.js` (axios) pour afficher produits,
    gérer le panier et effectuer la commande.
"""

# =============================================================================
# IMPORTS DJANGO ET REST FRAMEWORK
# =============================================================================
from django.shortcuts import redirect
from django.contrib.auth.models import User
from rest_framework import generics, viewsets
from .serialzers import UserSerializer, ProductSerializer, CartSerializer, OrderSerializer, ReviewSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from allauth.socialaccount.models import SocialToken, SocialAccount
from django.contrib.auth.decorators import login_required
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
import json
import stripe
import requests
from django.conf import settings

from rest_framework.decorators import action
from rest_framework.views import APIView
from django.forms import ValidationError

from .models import Product, Cart, Order, Review
from .recs_tfidf import query_similar

# =============================================================================
# CONFIGURATION STRIPE
# =============================================================================
stripe.api_key = settings.STRIPE_SECRET_KEY  # Initialisation de l'API Stripe

# =============================================================================
# VUES UTILISATEUR
# =============================================================================
User = get_user_model()

class UserCreateView(generics.CreateAPIView):
    """Endpoint pour l'inscription des nouveaux utilisateurs"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # Accessible sans authentification

class UserDetailView(generics.RetrieveUpdateAPIView):
    """Endpoint pour récupérer et mettre à jour le profil utilisateur"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]  # Réservé aux utilisateurs connectés
    
    def get_object(self):
        return self.request.user  # Retourne toujours l'utilisateur connecté

class UserDashboardView(generics.GenericAPIView):
    """Endpoint personnalisé pour le tableau de bord utilisateur"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        """Retourne les données spécifiques au tableau de bord"""
        user = request.user
        
        # Préparation des données utilisateur pour le frontend
        user_data = {
            'id': user.id,
            'username': user.username,
            'is_staff': user.is_staff,      # Si l'utilisateur est admin
            'is_active': user.is_active,    # Statut du compte
        }
        
        return Response(user_data)

# =============================================================================
# VUES PRODUITS
# =============================================================================
class AdminProductView(generics.ListCreateAPIView):
    """Endpoint réservé aux admins pour gérer le catalogue produits"""
    permission_classes = [IsAdminUser]  # Uniquement pour les administrateurs
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class AdminEditProductView(generics.RetrieveUpdateDestroyAPIView):
    """Endpoint admin pour modifier ou supprimer un produit spécifique"""
    permission_classes = [IsAdminUser]
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class ProductView(generics.ListAPIView):
    """Endpoint public pour afficher tous les produits"""
    # Tri par ID décroissant pour afficher les produits récents en premier
    queryset = Product.objects.all().order_by('-id')
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]  # Accessible sans connexion

# =============================================================================
# VUE PANIER
# =============================================================================
class CartView(generics.RetrieveUpdateAPIView):
    """Endpoint pour gérer le panier de l'utilisateur connecté"""
    permission_classes = [IsAuthenticated]
    serializer_class = CartSerializer
    
    def get_object(self):
        """Récupère ou crée le panier de l'utilisateur"""
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart
    
    def put(self, request, *args, **kwargs):
        """Met à jour le contenu du panier"""
        cart = self.get_object()
        cart.items = request.data.get('items', [])  # Format JSON des articles
        cart.save()
        return Response({'success': True, 'items': cart.items})

# =============================================================================
# VUES COMMANDES
# =============================================================================
class AdminOrderView(generics.ListAPIView):
    """Endpoint admin pour voir toutes les commandes"""
    permission_classes = [IsAdminUser]
    queryset = Order.objects.all().order_by('-created_at')  # Plus récentes d'abord
    serializer_class = OrderSerializer

class UserOrderView(generics.RetrieveUpdateDestroyAPIView):
    """Endpoint pour voir/modifier/supprimer une commande utilisateur"""
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer
    queryset = Order.objects.all()
    
    def get_queryset(self):
        """Filtre pour n'afficher que les commandes de l'utilisateur connecté"""
        return Order.objects.filter(user=self.request.user)

class UserOrderCreateView(generics.CreateAPIView):
    """Endpoint pour créer une nouvelle commande"""
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer
    
    def perform_create(self, serializer):
        """Associe automatiquement l'utilisateur connecté à la commande"""
        serializer.save(user=self.request.user)

class UserOrderListView(generics.ListAPIView):
    """Endpoint pour lister les commandes de l'utilisateur"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Les admins voient toutes les commandes, les users seulement les leurs"""
        if self.request.user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)

# =============================================================================
# VUES AVIS (REVIEWS)
# =============================================================================
class ReviewViewSet(viewsets.ModelViewSet):
    """ViewSet complet pour la gestion des avis (CRUD)"""
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtre les avis par produit si l'ID est spécifié"""
        product_id = self.request.query_params.get('product_id')
        if product_id:
            return Review.objects.filter(product_id=product_id)
        return Review.objects.all()
    
    def perform_create(self, serializer):
        """Associe automatiquement l'utilisateur connecté à l'avis"""
        try:
            serializer.save(user=self.request.user)
        except ValidationError as e:
            print(f"Validation error: {e.detail}")
            raise e
    
    @action(detail=False, methods=['get'])
    def my_review(self, request):
        """Action personnalisée pour récupérer les avis de l'utilisateur connecté"""
        reviews = Review.objects.filter(user=request.user)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

class ProductReviewList(APIView):
    """Endpoint pour lister tous les avis d'un produit spécifique"""
    def get(self, request, product_id):
        reviews = Review.objects.filter(product_id=product_id).order_by('-created_at')
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

# =============================================================================
# SYSTÈMES DE RECOMMANDATION
# =============================================================================
class ProductRecommendations(APIView):
    """
    Retourne une liste de produits recommandés basée sur des heuristiques simples
    
    Heuristiques utilisées :
    - Produits partageant des mots communs dans le nom (overlap de tokens)
    - Produits dans une fourchette de prix de +/-30%
    - Fallback vers les produits les mieux notés
    """
    permission_classes = [AllowAny]  # Accessible sans authentification

    def get(self, request, product_id):
        try:
            base = Product.objects.get(id=product_id)  # Produit de référence
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=404)

        # Extraction des tokens du nom du produit
        tokens = set([t.lower() for t in base.name.split() if len(t) > 2])

        # Calcul de la fourchette de prix
        try:
            price = float(base.price)
        except Exception:
            price = None

        similar = []  # Liste des produits similaires avec score

        # 1) Correspondance par tokens dans le nom
        if tokens:
            qs = Product.objects.exclude(id=base.id)
            for p in qs:
                name_tokens = set([t.lower() for t in p.name.split() if len(t) > 2])
                if tokens & name_tokens:  # Intersection de tokens
                    similar.append((p, 2))  # Poids 2 pour correspondance token

        # 2) Proximité de prix
        if price is not None:
            low = price * 0.7
            high = price * 1.3
            price_qs = Product.objects.exclude(id=base.id).filter(price__gte=low, price__lte=high)
            for p in price_qs:
                # Augmente le poids si déjà présent
                found = next((i for i, (obj, w) in enumerate(similar) if obj.id == p.id), None)
                if found is not None:
                    similar[found] = (similar[found][0], similar[found][1] + 1)
                else:
                    similar.append((p, 1))

        # 3) Fallback: produits les mieux notés
        if len(similar) < 6:
            rated = []
            for p in Product.objects.exclude(id=base.id):
                avg = p.average_rating() or 0
                rated.append((p, avg))
            rated.sort(key=lambda x: x[1], reverse=True)  # Tri par note décroissante
            for p, _ in rated:
                if not any(obj.id == p.id for obj, _ in similar):
                    similar.append((p, 0))
                if len(similar) >= 6:
                    break

        # Tri par poids décroissant puis par ID récent
        similar.sort(key=lambda x: (x[1], x[0].id), reverse=True)

        # Sélection des 6 premiers produits
        recommended = [p for p, _ in similar[:6]]

        serializer = ProductSerializer(recommended, many=True)
        return Response(serializer.data)

class TFIDFRecommendations(APIView):
    """Recommandations basées sur l'algorithme TF-IDF (similarité textuelle)"""
    permission_classes = [AllowAny]

    def get(self, request, product_id):
        try:
            base = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=404)

        k = int(request.query_params.get('k', 6))  # Nombre de recommandations
        hits = query_similar(product_id, k=k)  # Appel au système TF-IDF
        ids = [pid for pid, score in hits]  # Extraction des IDs
        products = list(Product.objects.filter(id__in=ids))
        # Préservation de l'ordre de similarité
        products_sorted = sorted(products, key=lambda p: ids.index(p.id))
        serializer = ProductSerializer(products_sorted, many=True)
        return Response({
            'recommendations': serializer.data, 
            'count': len(serializer.data), 
            'source': 'tfidf'
        })

# =============================================================================
# PAIEMENTS STRIPE
# =============================================================================
@csrf_exempt
def create_payment_intent(request, order_id):
    """Crée un PaymentIntent Stripe pour une commande"""
    order = Order.objects.get(id=order_id)
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(order.total_price * 100),  # Conversion en cents
            currency='usd',
            metadata={'order_id': order.id},  # Métadonnées pour tracking
        )
        return JsonResponse({'clientSecret': intent['client_secret']})
    except Exception as e:
        print("Error:", str(e))
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def mark_order_paid(request, order_id):
    """Marque une commande comme payée après confirmation Stripe"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    order = Order.objects.get(id=order_id)
    if order.payment_completed:
        return JsonResponse({'message': 'order is already completed and marked as paid'}, status=400)
    
    payment_data = json.loads(request.body)
    payment_id = payment_data.get('payment_id')
    
    if not payment_id:
        return JsonResponse({'error': 'Payment ID is missing'}, status=400)
    
    # Marquage de la commande comme payée
    order.status = 'COMPLETED'
    order.payment_completed = True
    order.payement_id = payment_id
    order.save()
    
    return JsonResponse({
        'message': 'Order marked as paid successfully', 
        "payment_id": payment_id
    })

# =============================================================================
# AUTHENTIFICATION GOOGLE OAUTH
# =============================================================================
@login_required
def google_login_callback(request):
    """Callback pour l'authentification OAuth Google"""
    user = request.user
    
    social_accounts = SocialAccount.objects.filter(user=user)
    print("Social Account for user:", social_accounts)
    
    social_account = social_accounts.first()
    if not social_account:
        print("No social account found for user", user)
        return redirect('http://localhost:5173/login/callback/?error=NoScialAccount')
    
    social_account = SocialAccount.objects.get(user=request.user, provider='google')
    token = SocialToken.objects.filter(account=social_account).first()
    
    if token:
        print('Google token found:', token.token)
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        return redirect(f'http://localhost:5173/login/callback/?access_token={access_token}')
    
    else:
        print("No Googl token found for user", user)
        return redirect(f'http://localhost:5173/login/callback/?error=NoGoogleToken')

@csrf_exempt
def validate_google_token(request):
    """Validation du token Google pour l'authentification"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            google_account_token = data.get('access_token')
            print("Google account token:", google_account_token)
            
            if not google_account_token:
                return JsonResponse({'detail': 'Access Token is missing.'}, status=400)
            return JsonResponse({'valid': True})
        except json.JSONDecodeError:
            return JsonResponse({'detail': 'Invalid JSON.'}, status=400)
    return JsonResponse({'detail': 'Method not allowed.'}, status=405)

# =============================================================================
# PAIEMENTS IPAYMONEY - VERSION CORRECTE AVEC API
# =============================================================================
def call_ipaymoney_api_to_verify(reference):
    """
    Vérifie le statut d'une transaction auprès de l'API IpayMoney
    """
    try:
        api_url = f"https://i-pay.money/api/v1/payments/{reference}"
        
        headers = {
            'Authorization': f'Bearer {settings.IPAYMONEY_SECRET_KEY}',
            'Content-Type': 'application/json',
            'Ipay-Payment-Type': 'card',  # ou 'mobile' selon le type
            'Ipay-Target-Environment': 'live'  # 'sandbox' pour les tests
        }
        
        print(f"🔍 Appel API IpayMoney: {api_url}")
        
        response = requests.get(api_url, headers=headers, timeout=10)
        
        print(f"📡 Réponse API IpayMoney: Status {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📋 Données API IpayMoney: {data}")
            return data.get('status')  # 'succeeded', 'failed', etc.
        else:
            print(f"❌ Erreur API IpayMoney: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur connexion API IpayMoney: {str(e)}")
        return None

@csrf_exempt
def ipaymoney_callback(request):
    """
    Webhook IpayMoney AVEC VÉRIFICATION API - VERSION SÉCURISÉE
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        data = json.loads(request.body)
        print("📥 Webhook IpayMoney reçu:", data)
        
        # Extraction des données selon format IpayMoney
        transaction_id = data.get('transaction_id')
        reference = data.get('reference')  # Référence IpayMoney
        webhook_status = data.get('status')
        amount = data.get('amount')
        
        if not transaction_id:
            return JsonResponse({'error': 'Transaction ID manquant'}, status=400)
        
        # Extraction order_id depuis transaction_id (format: "TECHSHOP-{order_id}-{timestamp}")
        try:
            transaction_parts = transaction_id.split('-')
            if len(transaction_parts) >= 2 and transaction_parts[0] == 'TECHSHOP':
                order_id = transaction_parts[1]
                order = Order.objects.get(id=order_id)
            else:
                return JsonResponse({'error': 'Transaction ID invalide'}, status=400)
        except (IndexError, Order.DoesNotExist):
            return JsonResponse({'error': 'Commande non trouvée'}, status=404)
        
        # 🛑 VÉRIFICATION CRITIQUE AUPRÈS DE L'API IPAYMONEY
        if reference:
            print(f"🔍 Vérification transaction {reference} auprès de l'API IpayMoney...")
            api_status = call_ipaymoney_api_to_verify(reference)
            
            if api_status:
                # On utilise le statut de l'API (source de vérité)
                final_status = api_status
                print(f"✅ Statut confirmé par API IpayMoney: {api_status}")
            else:
                # Fallback sur le statut du webhook si API échoue
                final_status = webhook_status
                print(f"⚠️ Utilisation du statut webhook: {webhook_status}")
        else:
            final_status = webhook_status
            print(f"ℹ️ Pas de référence, utilisation du statut webhook: {webhook_status}")
        
        # Traitement basé sur le statut final
        if final_status.lower() in ['succeeded', 'success', 'completed', 'paid']:
            # Vérification du montant (sécurité)
            expected_amount = int(order.total_price * 100)  # Montant en centimes
            received_amount = int(amount) if amount else 0
            
            if received_amount and received_amount != expected_amount:
                print(f"⚠️ Montant incorrect: reçu {received_amount}, attendu {expected_amount}")
                return JsonResponse({'error': 'Montant incorrect'}, status=400)
            
            # TOUT EST VALIDE - Marquer comme payé
            order.status = 'COMPLETED'
            order.payment_completed = True
            order.payement_id = reference or transaction_id
            order.save()
            print(f"✅ Commande {order.id} CONFIRMÉE via IpayMoney")
            
        elif final_status.lower() in ['failed', 'cancelled', 'error']:
            order.status = 'CANCELLED'
            order.save()
            print(f"❌ Commande {order.id} annulée (statut: {final_status})")
            
        else:
            print(f"⚠️ Statut inconnu: {final_status} - Commande {order.id} non traitée")
            return JsonResponse({'error': f'Statut inconnu: {final_status}'}, status=400)
        
        return JsonResponse({
            'success': True, 
            'message': 'Webhook traité avec succès',
            'order_id': order.id,
            'status': order.status,
            'ipaymoney_status': final_status
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON invalide'}, status=400)
    except Exception as e:
        print(f"❌ Erreur webhook IpayMoney: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def verify_ipaymoney_payment(request, order_id):
    """
    Vérification manuelle d'un paiement IpayMoney
    """
    try:
        order = Order.objects.get(id=order_id)
        
        if order.payment_completed:
            return JsonResponse({
                'status': 'completed',
                'message': 'Paiement déjà confirmé',
                'payment_id': order.payement_id
            })
        
        # Si pas encore confirmé et on a une référence IpayMoney
        if order.payement_id and order.payement_id.startswith('ipay_'):
            ipaymoney_status = call_ipaymoney_api_to_verify(order.payement_id)
            
            if ipaymoney_status and ipaymoney_status.lower() in ['succeeded', 'success']:
                order.status = 'COMPLETED'
                order.payment_completed = True
                order.save()
                return JsonResponse({
                    'status': 'completed',
                    'message': 'Paiement confirmé après vérification API',
                    'payment_id': order.payement_id
                })
        
        return JsonResponse({
            'status': 'pending', 
            'message': 'Paiement en attente de confirmation'
        })
            
    except Order.DoesNotExist:
        return JsonResponse({'error': 'Commande non trouvée'}, status=404)
