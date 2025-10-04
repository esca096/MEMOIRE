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
from django.conf import settings

from rest_framework.decorators import action
from rest_framework.views import APIView
from django.forms import ValidationError

from .models import Product, Cart, Order, Review



User = get_user_model()

class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    


class UserDashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        user = request.user
        
        #prepare user data
        user_data = {
            'id': user.id,
            'username': user.username,
            'is_staff': user.is_staff,
            'is_active': user.is_active,
        }
        
        return Response (user_data)




class AdminProductView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    

class AdminEditProductView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    

class ProductView(generics.ListAPIView):
    # Order by newest first so the homepage (first page) shows recently added products
    queryset = Product.objects.all().order_by('-id')
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]


class CartView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CartSerializer
    
    def get_object(self):
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart
    
    def put(self, request, *args, **kwargs):
        cart = self.get_object()
        cart.items = request.data.get('items', [])
        cart.save()
        return Response({'success': True, 'items': cart.items})


#admin views for all orders placed by users
class AdminOrderView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer

# oder view for users
class UserOrderView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer
    queryset = Order.objects.all()
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)
    
# creating a new order view for users
class UserOrderCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# users listing orders
class UserOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)


# Review view for users
class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        product_id = self.request.query_params.get('product_id')
        if product_id:
            return Review.objects.filter(product_id=product_id)
        return Review.objects.all()
    
    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except ValidationError as e:
            print(f"Validation error: {e.detail}")
            raise e
    
    @action(detail=False, methods=['get'])
    def my_review(self, request):
        reviews = Review.objects.filter(user=request.user)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

class ProductReviewList(APIView):
    def get(self, request, product_id):
        reviews = Review.objects.filter(product_id=product_id).order_by('-created_at')
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)


class ProductRecommendations(APIView):
    """Return a small list of recommended products given a product_id.

    Heuristics used (simple, no external AI required):
    - products sharing common words in the name (token overlap)
    - products within +/-30% price range
    - fallback to top-rated products
    """
    permission_classes = [AllowAny]

    def get(self, request, product_id):
        try:
            base = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=404)

        # basic token overlap on name
        tokens = set([t.lower() for t in base.name.split() if len(t) > 2])

        # price window
        try:
            price = float(base.price)
        except Exception:
            price = None

        similar = []

        # 1) token matches
        if tokens:
            qs = Product.objects.exclude(id=base.id)
            for p in qs:
                name_tokens = set([t.lower() for t in p.name.split() if len(t) > 2])
                if tokens & name_tokens:
                    similar.append((p, 2))  # weight 2 for token match

        # 2) price proximity
        if price is not None:
            low = price * 0.7
            high = price * 1.3
            price_qs = Product.objects.exclude(id=base.id).filter(price__gte=low, price__lte=high)
            for p in price_qs:
                # increase weight if not already present
                found = next((i for i, (obj, w) in enumerate(similar) if obj.id == p.id), None)
                if found is not None:
                    similar[found] = (similar[found][0], similar[found][1] + 1)
                else:
                    similar.append((p, 1))

        # 3) fallback: top rated products (based on reviews average)
        if len(similar) < 6:
            # annotate average rating manually
            rated = []
            for p in Product.objects.exclude(id=base.id):
                avg = p.average_rating() or 0
                rated.append((p, avg))
            rated.sort(key=lambda x: x[1], reverse=True)
            for p, _ in rated:
                if not any(obj.id == p.id for obj, _ in similar):
                    similar.append((p, 0))
                if len(similar) >= 6:
                    break

        # sort by weight desc then by recent id (as tiebreaker)
        similar.sort(key=lambda x: (x[1], x[0].id), reverse=True)

        # take up to 6 products
        recommended = [p for p, _ in similar[:6]]

        serializer = ProductSerializer(recommended, many=True)
        return Response(serializer.data)



stripe.api_key = settings.STRIPE_SECRET_KEY
@csrf_exempt
def create_payment_intent(request, order_id):
    order = Order.objects.get(id=order_id)
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(order.total_price * 100),  # Convert to cents
            currency='usd',
            metadata={'order_id': order.id},
        )
        return JsonResponse({'clientSecret': intent['client_secret']})
    except Exception as e:
        print("Error:", str(e))
        return JsonResponse({'error': str(e)}, status=500)




@csrf_exempt
def mark_order_paid(request, order_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    order = Order.objects.get(id=order_id)
    if order.payment_completed:
        return JsonResponse({'message': 'order is already completed and marked as paid'}, status=400)
    
    payment_data = json.loads(request.body)
    payment_id = payment_data.get('payment_id')
    
    
    if not payment_id:
        return JsonResponse({'error': 'Payment ID is missing'}, status=400)
    #mark as paid
    order.status = 'COMPLETED'
    order.payment_completed = True
    order.payement_id = payment_id
    
    return JsonResponse({'message': 'Order marked as paid successfully', "payment_id": payment_id})

   

@login_required
def google_login_callback(request):
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
    