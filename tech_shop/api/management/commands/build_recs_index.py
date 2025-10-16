"""
Fichier: api/management/commands/build_tfidf_index.py

Description (FR):
- Commande Django personnalisée pour construire l'index TF-IDF des recommandations
- S'appuie sur le module `recs_tfidf.py` pour générer les similarités entre produits
- Utilisable via `python manage.py build_tfidf_index`

Connexions :
- Utilise `api.recs_tfidf.build_index()` pour la logique de construction
- L'index est utilisé par `TFIDFRecommendations` dans `api/views.py`
- Les données proviennent du modèle `Product` dans `api/models.py`

Usage :
- Développement : Après ajout de nouveaux produits
- Production : Via cron job ou après mise à jour du catalogue
"""

from django.core.management.base import BaseCommand
from api import recs_tfidf  # Import du module de recommandations TF-IDF


class Command(BaseCommand):
    """
    Commande personnalisée Django pour construire l'index TF-IDF
    
    Cette commande permet de générer et de mettre à jour l'index des similarités
    entre produits basé sur l'algorithme TF-IDF (Term Frequency-Inverse Document Frequency)
    """
    
    help = 'Build TF-IDF recommendations index for products'

    def add_arguments(self, parser):
        """
        Définit les arguments optionnels de la commande
        
        Args:
            parser: Le parseur d'arguments argparse
        """
        parser.add_argument(
            '--force', 
            action='store_true', 
            help='Force rebuild index even if it already exists'
            # --force : Régénère l'index même s'il existe déjà
            # Sans --force : Ne rebuild que si l'index n'existe pas ou est obsolète
        )

    def handle(self, *args, **options):
        """
        Méthode principale exécutée lorsque la commande est appelée
        
        Args:
            *args: Arguments positionnels
            **options: Arguments optionnels (--force)
        """
        # Récupération de l'option --force (False par défaut)
        force = options.get('force', False)
        
        # Message de début d'exécution
        self.stdout.write('Building TF-IDF index...')
        
        # =====================================================================
        # CONSTRUCTION DE L'INDEX TF-IDF
        # =====================================================================
        # Appel de la fonction principale de construction d'index
        # Cette fonction :
        # 1. Récupère tous les produits depuis la base de données
        # 2. Extrait les caractéristiques (nom, description, catégorie)
        # 3. Calcule les vecteurs TF-IDF
        # 4. Calcule les similarités cosinus entre produits
        # 5. Sauvegarde l'index dans un fichier via joblib
        recs_tfidf.build_index(force=force)
        
        # Message de succès avec style vert
        self.stdout.write(
            self.style.SUCCESS('TF-IDF index built successfully!')
        )