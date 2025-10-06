#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tech_shop.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
#!/usr/bin/env python
"""
Fichier: manage.py

Description (FR):
- Point d'entrée principal pour les commandes d'administration Django.
- Permet d'exécuter toutes les commandes de gestion du projet via la ligne de commande.
- C'est le fichier que vous utilisez pour lancer le serveur, les migrations, etc.

Commandes principales :
- `python manage.py runserver` : Lance le serveur de développement
- `python manage.py makemigrations` : Crée les fichiers de migration
- `python manage.py migrate` : Applique les migrations à la base de données
- `python manage.py createsuperuser` : Crée un administrateur
- `python manage.py shell` : Ouvre le shell Django

Comment ce fichier se connecte :
- Configure l'environnement Django avec `tech_shop.settings`
- Passe le contrôle à Django pour exécuter les commandes
- Sert de pont entre votre terminal et l'application Django
"""

import os
import sys


def main():
    """Run administrative tasks."""
    # =========================================================================
    # CONFIGURATION DE L'ENVIRONNEMENT DJANGO
    # =========================================================================
    # Définit la variable d'environnement DJANGO_SETTINGS_MODULE
    # Cette variable indique à Django où trouver les paramètres du projet
    # Ici, elle pointe vers 'tech_shop.settings' (le module settings du projet)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tech_shop.settings')

    try:
        # =====================================================================
        # IMPORT ET EXÉCUTION DE LA COMMANDE DJANGO
        # =====================================================================
        # Importe la fonction qui va traiter toutes les commandes Django
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        # =====================================================================
        # GESTION DES ERREURS - DJANGO NON INSTALLÉ
        # =====================================================================
        # Cette erreur se produit si Django n'est pas installé ou accessible
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    
    # =========================================================================
    # EXÉCUTION DE LA COMMANDE
    # =========================================================================
    # execute_from_command_line() prend les arguments de la ligne de commande
    # et exécute la commande Django appropriée
    # sys.argv contient la liste des arguments passés au script
    # Exemple: ['manage.py', 'runserver', '0.0.0.0:8000']
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    # =========================================================================
    # POINT D'ENTRÉE DU SCRIPT
    # =========================================================================
    # Ce bloc s'exécute seulement si le fichier est appelé directement
    # (et non importé comme module)
    main()