"""
Fichier: tech_shop/asgi.py

Description (FR):
- Configuration ASGI pour le projet Django `tech_shop`.
- ASGI est l'interface asynchrone pour servir l'application (ex: déploiement
    avec des serveurs asynchrones comme uvicorn/daphne).

Comment ce fichier se connecte :
- Il charge la variable d'environnement `DJANGO_SETTINGS_MODULE` pointant vers
    `tech_shop.settings` puis expose `application` (callable ASGI) que le serveur
    d'applications utilisera pour démarrer l'app.

Voir aussi: `wsgi.py` (équivalent pour serveurs WSGI synchrones) et
`tech_shop/settings.py` pour la configuration du projet.
"""

import os

from django.core.asgi import get_asgi_application

# =============================================================================
# CONFIGURATION DE L'ENVIRONNEMENT DJANGO
# =============================================================================
# Définit la variable d'environnement DJANGO_SETTINGS_MODULE
# Cette variable indique à Django quel fichier de configuration utiliser
# Exactement comme dans wsgi.py, mais pour un contexte asynchrone
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tech_shop.settings')

# =============================================================================
# APPLICATION ASGI
# =============================================================================
# Crée l'application ASGI que le serveur web asynchrone utilisera
# Cette application est une callable qui suit le protocole ASGI
# (Asynchronous Server Gateway Interface)
#
# get_asgi_application() :
# - Initialise l'application Django en mode asynchrone
# - Configure les middlewares compatibles ASGI
# - Charge les mêmes settings que WSGI (tech_shop.settings)
# - Prépare l'application à recevoir des requêtes HTTP asynchrones
application = get_asgi_application()

# =============================================================================
# UTILISATION EN PRODUCTION AVEC SERVEURS ASYNCHRONES
# =============================================================================
# Ce fichier est utilisé par :
# 1. Uvicorn (serveur ASGI haute performance)
#    Commande: uvicorn tech_shop.asgi:application --host 0.0.0.0 --port 8000
#
# 2. Daphne (serveur ASGI pour Django Channels)
#    Commande: daphne tech_shop.asgi:application
#
# 3. Hypercorn (autre serveur ASGI)
#    Commande: hypercorn tech_shop.asgi:application
#
# 4. Pour les WebSockets (avec Django Channels) :
#    Il faudrait modifier ce fichier pour inclure le routing des Channels