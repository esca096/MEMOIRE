"""
Fichier: api/models.py

Description (FR):
- Définit les modèles de données principaux utilisés par l'application :
    - Product : représente un produit vendable (nom, description, prix, image, quantité).
    - Cart : panier d'un utilisateur stocké sous forme de JSON (liste d'items).
    - Order : commande passée par l'utilisateur (produits, adresse, statut, total, paiements).
    - Review : avis laissés par des utilisateurs sur des produits.

Comment ces fichiers se connectent :
- Les serializers (`api/serialzers.py`) transforment ces modèles en JSON pour l'API.
- Les vues (`api/views.py`) utilisent ces serializers et exposent des endpoints pour CRUD,
    gestion du panier, création de commandes et endpoints de recommandations.

Note sur les images : le champ `Product.image` est un ImageField qui enregistre
un chemin relatif côté serveur (ex: '/media/products_images/xxx.jpg'). Le frontend doit
préfixer ce chemin par l'URL du backend pour afficher l'image (logique implémentée côté
frontend dans `CartContext` et `Recommendations`).
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Product(models.Model):
    """Modèle représentant un produit dans le catalogue"""
    
    # Informations de base du produit
    name = models.CharField(max_length=200)  # Nom du produit
    description = models.TextField()  # Description détaillée
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Prix unitaire
    quantity = models.PositiveIntegerField()  # Stock disponible
    created_at = models.DateTimeField(auto_now_add=True)  # Date de création
    image = models.ImageField(upload_to='products_images/', blank=True, null=True)  # Image du produit
    
    def __str__(self):
        """Représentation textuelle du produit"""
        return self.name
    
    class Meta:
        """Métadonnées du modèle"""
        ordering = ['id']  # Tri par défaut par ID
        
    def average_rating(self):
        """Calcule la note moyenne des avis pour ce produit"""
        review = self.reviews.all()  # Récupère tous les avis liés
        if review.exists():
            return review.aggregate(models.Avg('rating'))['rating__avg']  # Moyenne des notes
        return 0  # Retourne 0 si aucun avis
        

class Cart(models.Model):
    """Modèle représentant le panier d'achat d'un utilisateur"""
    
    # Lien 1-1 avec l'utilisateur (chaque utilisateur a un seul panier)
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    
    # Stockage des articles du panier sous forme JSON
    # Format: [{"product_id": 1, "quantity": 2}, ...]
    items = models.JSONField(default=list)  # Liste des IDs produits et quantités
    
    def __str__(self):
        """Représentation textuelle du panier"""
        return f"{self.user.username}'s Cart"
    

class Order(models.Model):
    """Modèle représentant une commande passée par un utilisateur"""
    
    # Définition des statuts de commande
    PENDING = 'PENDING'  # Commande en attente
    COMPLETED = 'COMPLETED'  # Commande terminée
    CANCELLED = 'CANCELLED'  # Commande annulée
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (COMPLETED, 'Completed'),
        (CANCELLED, 'Cancelled'),
    ]
    
    # Lien avec l'utilisateur (peut être null pour les commandes invitées)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    # Informations de livraison
    address = models.CharField(max_length=255, default=None)  # Adresse
    city = models.CharField(max_length=255, default=None)  # Ville
    country = models.CharField(max_length=255, default=None)  # Pays
    
    # Produits commandés stockés en JSON
    # Format: [{"product_id": 1, "quantity": 2, "price": "99.99"}, ...]
    products = models.JSONField(default=list)  # Liste des produits commandés
    
    # Détails de la commande
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)  # Statut
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # Prix total
    
    # Horodatages
    created_at = models.DateTimeField(default=timezone.now)  # Date de création
    updated_at = models.DateTimeField(auto_now=True)  # Date de modification
    
    # Détails de paiement
    payment_completed = models.BooleanField(default=False)  # Paiement effectué
    payement_id = models.CharField(max_length=255, null=True, blank=True)  # ID de paiement Stripe
   
    
    def __str__(self):
        """Représentation textuelle de la commande"""
        return f"Order {self.id} by {self.user.username} - Status: {self.status}"
    
    def calculate_total(self):
        """Calcule le prix total de la commande basé sur les produits"""
        return sum(float(item['price']) * item['quantity'] for item in self.products)
    
    def save(self, *args, **kwargs):
        """Surcharge de la sauvegarde pour calculer automatiquement le total"""
        if not self.total_price:
            self.total_price = self.calculate_total()  # Calcule le total si non défini
        super().save(*args, **kwargs)  # Appel de la méthode save parente


class Review(models.Model):
    """Modèle représentant un avis utilisateur sur un produit"""
    
    # Lien avec le produit évalué
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    
    # Lien avec l'utilisateur qui a posté l'avis
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Note de 1 à 5 étoiles
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])  # Note de 1 à 5
    
    # Commentaire texte (optionnel)
    comment = models.TextField(blank=True, null=True)
    
    # Horodatages
    created_at = models.DateTimeField(auto_now_add=True)  # Date de création
    updated_at = models.DateTimeField(auto_now=True)  # Date de modification
    
    
    def __str__(self):
        """Représentation textuelle de l'avis"""
        return f"Review of {self.product.name} by {self.user.username}"
    
    class Meta:
        """Métadonnées du modèle - empêche les doublons"""
        unique_together = ('product', 'user')  # Un utilisateur ne peut aviser qu'une fois un produit