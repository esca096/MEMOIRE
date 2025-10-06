"""
Fichier: api/recs_tfidf.py

Description (FR):
- Implémente une indexation locale TF-IDF pour fournir des recommandations
    de produits similaires sans dépendre de services externes.

- Fonctions principales :
    - build_index(force=False) : construit l'index TF-IDF à partir des champs
        `name` + `description` des produits, et persiste le vecteur, la matrice et
        la liste d'ids sur disque avec joblib dans `recs_index/`.
    - query_similar(product_id, k=6) : charge les artefacts et renvoie jusqu'à k
        produits similaires sous forme de liste de tuples (product_id, score).

Comment ces fichiers se connectent :
- La vue `TFIDFRecommendations` dans `api/views.py` appelle `query_similar`
    pour récupérer les ids similaires puis sérialise les produits via
    `ProductSerializer` pour renvoyer des objets JSON au frontend.

Remarque sécurité/ops :
- Les dépendances (scikit-learn, joblib, numpy) doivent être installées côté
    backend avant d'exécuter `python manage.py build_recs_index`.
"""

import os
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer  # Vectorisation TF-IDF
from sklearn.metrics.pairwise import linear_kernel  # Calcul similarité cosinus
import joblib  # Sauvegarde/chargement des modèles

from .models import Product  # Modèle Product pour récupérer les données

# =============================================================================
# CONFIGURATION DES CHEMINS DE STOCKAGE
# =============================================================================
BASE_DIR = Path(__file__).resolve().parent.parent  # Répertoire racine du projet
STORE_DIR = BASE_DIR / 'recs_index'  # Dossier de stockage des index
STORE_DIR.mkdir(exist_ok=True)  # Crée le dossier s'il n'existe pas

# Chemins des fichiers de sauvegarde
VECTORIZER_PATH = STORE_DIR / 'tfidf_vectorizer.joblib'  # Vecteur TF-IDF entraîné
MATRIX_PATH = STORE_DIR / 'tfidf_matrix.joblib'  # Matrice des caractéristiques
IDS_PATH = STORE_DIR / 'product_ids.joblib'  # Liste des IDs produits indexés


def build_index(force=False):
    """
    Construit l'index TF-IDF à partir des noms et descriptions des produits
    
    Args:
        force (bool): Si True, force la reconstruction même si l'index existe
    """
    # Vérifie si l'index existe déjà et si on ne force pas la reconstruction
    if VECTORIZER_PATH.exists() and MATRIX_PATH.exists() and IDS_PATH.exists() and not force:
        return  # Index déjà existant, on sort

    # Récupère tous les produits de la base de données
    products = Product.objects.all()
    docs = []  # Liste des textes à analyser (nom + description)
    ids = []   # Liste des IDs produits correspondants
    
    # Prépare les données pour le TF-IDF
    for p in products:
        # Combine le nom et la description en un seul texte
        text = f"{p.name or ''} " + (p.description or '')
        docs.append(text)
        ids.append(p.id)

    # Cas où il n'y a pas de produits à indexer
    if not docs:
        # Sauvegarde des structures vides
        joblib.dump([], IDS_PATH)
        joblib.dump(None, VECTORIZER_PATH)
        joblib.dump(None, MATRIX_PATH)
        return

    # Création du vectoriseur TF-IDF avec paramètres
    vectorizer = TfidfVectorizer(
        max_features=10000,  # Nombre maximum de caractéristiques (mots)
        stop_words='english'  # Supprime les mots vides anglais (the, and, etc.)
    )
    
    # Transformation des textes en matrice TF-IDF
    matrix = vectorizer.fit_transform(docs)

    # Sauvegarde des artefacts sur le disque
    joblib.dump(vectorizer, VECTORIZER_PATH)  # Sauvegarde le vectoriseur
    joblib.dump(matrix, MATRIX_PATH)          # Sauvegarde la matrice TF-IDF
    joblib.dump(ids, IDS_PATH)                # Sauvegarde la liste des IDs


def query_similar(product_id, k=6):
    """
    Trouve les produits similaires à un produit donné
    
    Args:
        product_id (int): ID du produit de référence
        k (int): Nombre maximum de produits similaires à retourner
    
    Returns:
        list: Liste de tuples (product_id, score_similarité)
    """
    # Vérifie si les fichiers d'index existent, sinon construit l'index
    if not VECTORIZER_PATH.exists() or not MATRIX_PATH.exists() or not IDS_PATH.exists():
        build_index()  # Construction automatique si index manquant

    # Chargement des artefacts depuis le disque
    ids = joblib.load(IDS_PATH)           # Liste des IDs produits
    vectorizer = joblib.load(VECTORIZER_PATH)  # Vectoriseur TF-IDF
    matrix = joblib.load(MATRIX_PATH)     # Matrice des caractéristiques

    # Vérification des données chargées
    if not ids or vectorizer is None or matrix is None:
        return []  # Retourne liste vide si problème

    try:
        # Trouve l'index du produit dans la liste
        idx = ids.index(product_id)
    except ValueError:
        # Produit non trouvé dans l'index
        return []

    # Calcul des similarités cosinus entre le produit et tous les autres
    cosine_similarities = linear_kernel(matrix[idx:idx+1], matrix).flatten()
    
    # Met la similarité avec soi-même à -1 pour éviter de se recommander
    cosine_similarities[idx] = -1
    
    # Trie les indices par similarité décroissante et prend les k premiers
    related_indices = cosine_similarities.argsort()[::-1][:k]

    # Construction du résultat
    result = []
    for i in related_indices:
        if cosine_similarities[i] <= 0:
            continue  # Ignore les similarités négatives ou nulles
        # Ajoute le tuple (ID produit, score de similarité)
        result.append((ids[i], float(cosine_similarities[i])))

    return result
