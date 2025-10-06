"""
Fichier: api/apps.py

Description (FR):
- Configuration de l'application Django `api`
- Définit la classe de configuration de l'application
- Utilisée par Django pour initialiser l'application et ses composants

Connexions :
- Référencée dans `INSTALLED_APPS` de `tech_shop/settings.py`
- Django utilise cette classe pour charger l'application
- Définit le type de clé primaire par défaut pour les modèles

Fonctionnalités avancées :
- Méthode `ready()` pour exécuter du code au chargement de l'application
- Configuration des signaux (signals)
- Initialisation des services au démarrage
"""

from django.apps import AppConfig


class ApiConfig(AppConfig):
    """
    Configuration de l'application 'api'
    
    Cette classe configure le comportement de l'application Django :
    - Définit le type de clé primaire par défaut
    - Spécifie le nom de l'application
    - Permet d'exécuter du code au démarrage via ready()
    """
    
    # =========================================================================
    # TYPE DE CLÉ PRIMAIRE PAR DÉFAUT
    # =========================================================================
    # Définit le type de champ auto-incrémenté par défaut pour les modèles
    # 'django.db.models.BigAutoField' : Clé primaire 64-bit (recommandé)
    # Alternative : 'django.db.models.AutoField' (32-bit, legacy)
    default_auto_field = 'django.db.models.BigAutoField'
    
    # =========================================================================
    # NOM DE L'APPLICATION
    # =========================================================================
    # Le nom du module Python de l'application
    # Doit correspondre au nom du dossier de l'application
    name = 'api'
    
    # =========================================================================
    # MÉTHODE READY() (PERSONNALISATION POSSIBLE)
    # =========================================================================
    # Décommentez pour exécuter du code au chargement de l'application
    # def ready(self):
    #     """
    #     Méthode appelée quand Django a chargé l'application
    #     Utilisations courantes :
    #     - Importer et enregistrer les signaux (signals)
    #     - Initialiser des services externes
    #     - Charger des données de configuration
    #     - Vérifier les dépendances
    #     """
    #     # Exemple : import des signaux
    #     from . import signals
    #     
    #     # Exemple : initialisation du système de recommandations
    #     from .recs_tfidf import initialize_recommendation_system
    #     initialize_recommendation_system()