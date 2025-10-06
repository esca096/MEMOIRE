/**
 * Fichier: frontend/src/components/CartActions.jsx
 *
 * Description (FR):
 * - Petites fonctions utilitaires qui effectuent les appels réseau pour
 *   récupérer (`fetchCart`) et mettre à jour (`updateCart`) le panier d'un
 *   utilisateur via l'API REST backend (`api/cart/`).
 * - Gère l'ajout des en-têtes d'authentification (token standard ou token Google)
 *   nécessaires pour accéder aux endpoints protégés.
 */

import api from '../api';  // Instance Axios configurée
import { ACCESS_TOKEN, GOOGLE_ACCESS_TOKEN } from '../token';  // Constantes des tokens

// Récupération du panier depuis l'API
export const fetchCart = async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN);  // Token JWT standard
    const googleAccessToken = localStorage.getItem(GOOGLE_ACCESS_TOKEN);  // Token Google OAuth

    // Détermination du token à utiliser
    const headers = {};  // Initialisation des en-têtes
    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;  // En-tête d'autorisation JWT
    } else if (googleAccessToken) {
        headers['X-Google-Access-Token'] = googleAccessToken;  // En-tête personnalisé Google
    }else {
        throw new Error('No access token found');  // Erreur si aucun token disponible
    }

    // Récupération du panier via l'API
    const response = await api.get('api/cart/', {headers});  // Requête GET vers l'endpoint panier
    return response.data.items;  // Retourne les articles du panier
};

// Mise à jour des articles du panier
export const updateCart =  async (cartItems) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN);  // Token JWT standard
    const googleAccessToken = localStorage.getItem(GOOGLE_ACCESS_TOKEN);  // Token Google OAuth

    // Détermination du token à utiliser
    const headers = {};  // Initialisation des en-têtes
    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;  // En-tête d'autorisation JWT
    } else if (googleAccessToken) {
        headers['X-Google-Access-Token'] = googleAccessToken;  // En-tête personnalisé Google
    }else {
        throw new Error('No access token found');  // Erreur si aucun token disponible
    }

    // Mise à jour du panier via l'API
    await api.put('api/cart/', { items: cartItems }, { headers });  // Requête PUT avec les nouveaux articles
    
}