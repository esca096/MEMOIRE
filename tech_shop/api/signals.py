"""
Fichier: api/signals.py

Description (FR):
- Implémente un système de signaux Django pour automatiser la création du panier
  lorsqu'un nouvel utilisateur est créé.

- Fonctionnalité :
    - `create_or_update_cart` : écoute le signal `post_save` du modèle User
    - Crée automatiquement un panier vide pour tout nouvel utilisateur

Comment ces fichiers se connectent :
- Le signal est connecté dans `api/apps.py` via la méthode `ready()`
- Lorsqu'un utilisateur est créé (via register, admin, ou createsuperuser),
  un panier lui est automatiquement associé
- Évite les erreurs dans les vues où on suppose qu'un utilisateur a toujours un panier
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Cart


# Signal pour créer un panier à chaque fois qu'un nouvel utilisateur est créé
@receiver(post_save, sender=User)
def create_or_update_cart(sender, instance, created, **kwargs):
    """
    Récepteur de signal qui crée un panier pour chaque nouvel utilisateur
    
    Args:
        sender: La classe qui a envoyé le signal (User)
        instance: L'instance User qui vient d'être sauvegardée
        created (bool): True si l'instance vient d'être créée (pas mise à jour)
        **kwargs: Arguments supplémentaires
    """
    if created:
        # Crée un nouveau panier seulement si l'utilisateur est nouvellement créé
        Cart.objects.create(user=instance)
        # Note: Le panier est créé avec items=[] (valeur par défaut du JSONField)