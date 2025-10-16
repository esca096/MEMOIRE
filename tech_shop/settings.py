"""
Fichier: tech_shop/settings.py

Description (FR):
- Contient la configuration principale Django pour le projet `tech_shop`.
- Paramètres importants :
    - `INSTALLED_APPS` : applications Django enregistrées (dont `api`).
    - `MIDDLEWARE` : middleware actifs (corsheaders, authentification, csrf, etc.).
    - `DATABASES` : configuration SQLite utilisée en développement.
    - `REST_FRAMEWORK` : configuration DRF (JWT, pagination, permissions par défaut).
    - `MEDIA_URL` / `MEDIA_ROOT` : emplacement des fichiers uploadés (produit.image).

Comment ce fichier se connecte :
- Les vues et modèles (dans `api/`) s'appuient sur ces paramètres pour
    fonctionner correctement (par ex. `MEDIA_ROOT` pour servir les images).

Sécurité / déploiement :
- `SECRET_KEY` et `DEBUG` sont ici en mode développement. En production, stockez
    `SECRET_KEY` dans des variables d'environnement et activez des restrictions
    dans `ALLOWED_HOSTS`.
"""

from pathlib import Path
from datetime import timedelta
import os
from decouple import config  # Pour les variables d'environnement
from corsheaders.defaults import default_headers
import dj_database_url

# =============================================================================
# CONFIGURATION DES CHEMINS DU PROJET
# =============================================================================
# BASE_DIR pointe vers le répertoire racine du projet (tech_shop/)
# Permet de construire des chemins relatifs dans tout le projet
BASE_DIR = Path(__file__).resolve().parent.parent

# =============================================================================
# CONFIGURATION DE SÉCURITÉ - IMPORTANT POUR LA PRODUCTION
# =============================================================================
# SECRET_KEY: Clé secrète pour le hachage et la sécurité
# ⚠️  EN PRODUCTION: Doit être stockée dans les variables d'environnement
SECRET_KEY = config("DJANGO_SECRET_KEY")

# DEBUG: Mode débogage - affiche les erreurs détaillées
# ⚠️  EN PRODUCTION: Doit être mis à False
DEBUG = True

# ALLOWED_HOSTS: Domaines autorisés à servir l'application
# ⚠️  EN PRODUCTION: Remplacer "*" par les domaines spécifiques
ALLOWED_HOSTS = ["*"]

# =============================================================================
# APPLICATIONS INSTALLÉES
# =============================================================================
INSTALLED_APPS = [
    # Applications Django par défaut
    'whitenoise.runserver_nostatic',
    'django.contrib.admin',        # Interface d'administration
    'django.contrib.auth',         # Système d'authentification
    'django.contrib.contenttypes', # Système de types de contenu
    'django.contrib.sessions',     # Gestion des sessions
    'django.contrib.messages',     # Système de messages
    'django.contrib.staticfiles',  # Gestion des fichiers statiques
    
    # Applications tierces et personnalisées
    'api',                         # Notre application principale API
    'corsheaders',                 # Gestion CORS pour les requêtes cross-origin
    'rest_framework',              # Django REST Framework pour les API
    'allauth',                     # Authentification unifiée
    'allauth.account',             # Comptes AllAuth
    'allauth.socialaccount',       # Authentification sociale
    'allauth.socialaccount.providers.google',  # Provider Google OAuth
    'rest_framework.authtoken',    # Tokens d'authentification REST
]

# =============================================================================
# MIDDLEWARE - PROCESSUS DE TRAITEMENT DES REQUÊTES
# =============================================================================
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',      # Sécurité HTTP
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware', # Gestion sessions
    'corsheaders.middleware.CorsMiddleware',              # CORS (doit être placé tôt)
    'django.middleware.common.CommonMiddleware',          # Normalisation URLs
    'django.middleware.csrf.CsrfViewMiddleware',          # Protection CSRF
    'django.contrib.auth.middleware.AuthenticationMiddleware', # Authentification
    'django.contrib.messages.middleware.MessageMiddleware',    # Messages
    'django.middleware.clickjacking.XFrameOptionsMiddleware',  # Protection clickjacking
    'allauth.account.middleware.AccountMiddleware',       # Middleware AllAuth
]

# =============================================================================
# CONFIGURATION DES URLS ET TEMPLATES
# =============================================================================
ROOT_URLCONF = 'tech_shop.urls'  # Module racine des URLs

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',  # Requête dans context
                'django.contrib.auth.context_processors.auth',  # Utilisateur auth
                'django.contrib.messages.context_processors.messages', # Messages
            ],
        },
    },
]

# Point d'entrée WSGI pour le serveur web
WSGI_APPLICATION = 'tech_shop.wsgi.application'

# =============================================================================
# CONFIGURATION DE LA BASE DE DONNÉES
# =============================================================================
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',  # Base de données SQLite
#         'NAME': BASE_DIR / 'db.sqlite3',         # Fichier de la base de données
#     }
# }
# ⚠️  EN PRODUCTION: Remplacer par PostgreSQL/MySQL avec variables d'environnement

database_password = config("DATABASE_PASSWORD")

DATABASES = {
    'default': dj_database_url.parse(
        config('DATABASE_URL'),
        conn_max_age=600  # Garde la connexion ouverte (optionnel)
    )
}

# =============================================================================
# VALIDATION DES MOTS DE PASSE
# =============================================================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# =============================================================================
# CONFIGURATION DJANGO REST FRAMEWORK
# =============================================================================
REST_FRAMEWORK = {
    # Authentification JWT par défaut pour toutes les vues API
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # Permissions par défaut - authentification requise pour toutes les vues API
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # Pagination pour les listes d'objets
    "DEFAULT_PAGINATION_CLASS": 'rest_framework.pagination.PageNumberPagination',
    "PAGE_SIZE": 8  # 8 éléments par page
}

# =============================================================================
# CONFIGURATION CORS (CROSS-ORIGIN RESOURCE SHARING)
# =============================================================================
# En-têtes CORS autorisés
CORS_ALLOW_HEADERS = list(default_headers) + [
    "X-Google-Access-Token",  # Header personnalisé pour l'authentification Google
]

CORS_ALLOWS_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = [
    'https://tech-shop-rho.vercel.app',  # Frontend URL PRD
]

# =============================================================================
# CONFIGURATION JWT (JSON WEB TOKENS)
# =============================================================================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),  # Token court pour la sécurité
    'REFRESH_TOKEN_LIFETIME': timedelta(days=3),     # Token long pour le rafraîchissement
}

# =============================================================================
# CONFIGURATION D'AUTHENTIFICATION
# =============================================================================
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',     # Authentification Django standard
    'allauth.account.auth_backends.AuthenticationBackend',  # Authentification AllAuth
]

# =============================================================================
# INTERNATIONALISATION
# =============================================================================
LANGUAGE_CODE = 'en-us'   # Langue de l'interface
TIME_ZONE = 'UTC'         # Fuseau horaire
USE_I18N = True           # Internationalisation
USE_TZ = True             # Support des fuseaux horaires

# =============================================================================
# CONFIGURATION DES FICHIERS MÉDIA (UPLOADS)
# =============================================================================
MEDIA_URL = '/media/'     # URL pour accéder aux fichiers media
MEDIA_ROOT = BASE_DIR /'media'  # Dossier de stockage des fichiers uploadés

# =============================================================================
# CONFIGURATION DES FICHIERS STATIQUES
# =============================================================================
STATIC_URL = 'static/'    # URL pour les fichiers statiques (CSS, JS)

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# =============================================================================
# CONFIGURATION AUTRE
# =============================================================================
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'  # Type de clé primaire par défaut

# =============================================================================
# CONFIGURATION ALLAUTH (AUTHENTIFICATION SOCIALE)
# =============================================================================
LOGIN_REDIRECT_URL = '/callback/'  # Redirection après connexion réussie

# Configuration du provider Google OAuth2
SOCIALACCOUNT_PROVIDERS = {
    'google':{
        'SCOPE': ['email', 'profile'],     # Données demandées à Google
        'AUTH_PARAMS': {'access_type': 'online'},  # Type d'accès
        'OAUTH_PKCE_ENABLED': True,        # Sécurité PKCE
        'FETCH_USERINFO': True,            # Récupération des infos utilisateur
    }
}

SOCIALACCOUNT_STORE_TOKENS = True  # Stockage des tokens OAuth

# =============================================================================
# CONFIGURATION STRIPE (PAIEMENTS)
# =============================================================================
# Clé secrète Stripe récupérée depuis les variables d'environnement
STRIPE_SECRET_KEY = config("STRIPE_SECRET_KEY")

GDAL_LIBRARY_PATH = 'C:/Program Files/GDAL/gdal.dll'

GEOS_LIBRARY_PATH = 'C:/Program Files/GDAL/geos_c.dll'