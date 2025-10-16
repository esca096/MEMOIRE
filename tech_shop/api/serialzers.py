"""
Fichier: api/serializers.py

Description (FR):
- Contient les serializers Django REST Framework qui convertissent les instances
    de modèles Python (Product, Cart, Order, Review) en représentation JSON pour
    l'API et inversement.

- Principales classes :
    - UserSerializer : sérialisation/création d'utilisateurs.
    - ProductSerializer : sérialisation des produits ; ajoute des champs calculés
        comme `review_count` et `average_rating`.
    - CartSerializer : sérialise le champ `items` du modèle Cart (JSONField).
    - OrderSerializer : pour créer/afficher des commandes (stocke la liste products comme JSON).

Comment ces fichiers se connectent :
- Les vues dans `api/views.py` utilisent ces serializers pour valider les données
    entrantes et formater les réponses envoyées au frontend.
"""

from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Product, Cart, Order, Review


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle User de Django
    
    Utilisations :
    - Création de nouveaux utilisateurs (register)
    - Affichage des informations utilisateur (profil)
    """
    
    class Meta:
        model = User
        fields = ('id', 'username', 'password')  # Champs inclus dans l'API
        extra_kwargs = {
            'password': {'write_only': True}  # Le mot de passe n'est jamais renvoyé
        }
        
    def create(self, validated_data):
        """
        Surcharge de la création pour hasher le mot de passe
        
        Args:
            validated_data: Données validées du serializer
        
        Returns:
            User: Instance utilisateur créée avec mot de passe hashé
        """
        # Utilise create_user qui hash le mot de passe automatiquement
        user = User.objects.create_user(**validated_data)
        return user
    

class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle Product
    
    Ajoute des champs calculés :
    - review_count: Nombre total d'avis
    - average_rating: Note moyenne des avis
    """
    
    # Champ calculé - nombre total d'avis
    review_count = serializers.IntegerField(source='reviews.count', read_only=True)
    
    # Champ calculé - note moyenne via une méthode
    average_rating = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'  # Inclut tous les champs du modèle
        
    def get_average_rating(self, obj):
        """
        Méthode pour calculer la note moyenne
        
        Args:
            obj: Instance du modèle Product
        
        Returns:
            float: Note moyenne ou 0 si aucun avis
        """
        return obj.average_rating()  # Appelle la méthode du modèle
    

class CartSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle Cart (Panier)
    
    Format des items JSON :
    [{"product_id": 1, "quantity": 2}, ...]
    """
    
    class Meta:
        model = Cart
        fields = ['items']  # Seul champ sérialisé (contenu du panier)
        

class OrderSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle Order (Commande)
    
    Gère :
    - Sérialisation des produits en JSON
    - Affichage des informations utilisateur
    - Calcul automatique du prix total
    """
    
    # Champ produits stocké en JSON
    products = serializers.JSONField()
    
    # Utilisateur en lecture seule (sérialisé)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'address', 'city', 'country', 
            'products', 'total_price', 'status'
        ]
        read_only_fields = [
            'id', 'user', 'total_price', 'created_at', 'updated_at'
        ]
        
    def create(self, validated_data):
        """
        Surcharge de la création pour gérer les produits JSON
        
        Args:
            validated_data: Données validées du serializer
        
        Returns:
            Order: Instance de commande créée
        """
        # Extrait les données produits
        products_data = validated_data.pop('products')
        
        # Crée la commande sans les produits d'abord
        order = Order.objects.create(**validated_data)
        
        # Assigne les produits en JSON
        order.products = products_data
        
        # Sauvegarde (déclenche calculate_total automatiquement)
        order.save()
        
        return order


class ReviewSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle Review (Avis)
    
    Affiche le nom d'utilisateur au lieu de l'ID
    """
    
    # Affiche le username au lieu de l'ID utilisateur
    user = serializers.StringRelatedField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'product', 'user', 'rating', 'comment', 'created_at'
        ]