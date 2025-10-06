"""
Fichier: tech_shop/wsgi.py

Description (FR):
- Configuration WSGI pour le projet Django. Expose la callable `application`
    utilisée par les serveurs WSGI synchrones (ex: gunicorn, mod_wsgi).

Comment ce fichier se connecte :
- Il charge `DJANGO_SETTINGS_MODULE` et retourne `application` que le serveur
    utilisera pour traiter les requêtes HTTP.

Voir aussi: `asgi.py` pour les serveurs asynchrones et `settings.py` pour
la configuration de l'application.
"""

import os

from django.core.wsgi import get_wsgi_application

# =============================================================================
# CONFIGURATION DE L'ENVIRONNEMENT DJANGO
# =============================================================================
# Définit la variable d'environnement DJANGO_SETTINGS_MODULE
# Cette variable indique à Django quel fichier de configuration utiliser
# Ici, elle pointe vers le module 'tech_shop.settings'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tech_shop.settings')

# =============================================================================
# APPLICATION WSGI
# =============================================================================
# Crée l'application WSGI que le serveur web utilisera
# Cette application est une callable (fonction ou objet appelable) qui suit
# le protocole WSGI (Web Server Gateway Interface)
#
# get_wsgi_application() :
# - Initialise l'application Django
# - Configure les middlewares
# - Charge les settings
# - Prépare l'application à recevoir des requêtes HTTP
application = get_wsgi_application()

# =============================================================================
# UTILISATION EN PRODUCTION
# =============================================================================
# Ce fichier est utilisé par :
# 1. Gunicorn (serveur WSGI pour Python)
#    Commande: gunicorn tech_shop.wsgi:application
#
# 2. mod_wsgi (Apache)
#    Configuration Apache:
#    WSGIDaemonProcess tech_shop python-path=/chemin/vers/projet
#    WSGIProcessGroup tech_shop
#    WSGIScriptAlias / /chemin/vers/tech_shop/wsgi.py
#
# 3. uWSGI
#    Commande: uwsgi --module tech_shop.wsgi:application
#
# 4. Serveurs de développement (pour test)
#    python manage.py runserver (utilise aussi WSGI en mode développement)
