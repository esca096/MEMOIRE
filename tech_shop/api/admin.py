"""
Fichier: api/admin.py

Description (FR):
- Configuration de l'interface d'administration Django pour l'application `api`
- Enregistre les modèles pour qu'ils soient visibles et modifiables dans l'admin
- Interface accessible via /admin/ pour la gestion des données

Connexions :
- Les modèles enregistrés sont définis dans `api/models.py`
- L'interface utilise `django.contrib.admin`
- Les permissions sont gérées par le système d'authentification Django

Personnalisations possibles :
- Ajouter des filtres, recherches, list_display pour chaque modèle
- Créer des actions personnalisées
- Grouper les modèles par section
"""

from django.contrib import admin

# Import des modèles de l'application api
from .models import Product, Cart, Order, Review


# =============================================================================
# ENREGISTREMENT DES MODÈLES DANS L'ADMIN
# =============================================================================

# Produits - Catalogue de la boutique
admin.site.register(Product)
# Utilisation : Gestion du catalogue produits
# Accès : /admin/api/product/
# Permissions : Ajouter, modifier, supprimer des produits

# Panier - Paniers d'achat des utilisateurs
admin.site.register(Cart)
# Utilisation : Voir les paniers en cours
# Accès : /admin/api/cart/
# Permissions : Surveiller l'activité des paniers

# Commandes - Historique des commandes passées
admin.site.register(Order)
# Utilisation : Gestion des commandes, suivi du statut
# Accès : /admin/api/order/
# Permissions : Mettre à jour le statut des commandes

# Avis - Commentaires et notations des produits
admin.site.register(Review)
# Utilisation : Modération des avis clients
# Accès : /admin/api/review/
# Permissions : Supprimer les avis inappropriés