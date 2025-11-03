/**
 * Fichier: api.js (Configuration Axios)
 * 
 * Description (FR):
 * - Configuration centralisée du client HTTP Axios pour les appels API
 * - Définit l'URL de base et les intercepteurs pour l'authentification
 * - Gère automatiquement l'ajout des tokens JWT et Google aux requêtes
 * 
 * Fonctionnalités principales :
 * - Configuration de base avec l'URL de l'API Django
 * - Intercepteurs pour ajouter les tokens d'authentification
 * - Support à la fois des tokens JWT Bearer et Google OAuth
 * - Gestion centralisée des erreurs d'authentification
 * 
 * Connexions :
 * - Utilisé par tous les composants qui font des appels API
 * - Intègre avec le système d'authentification via les tokens
 * - Se connecte au backend Django sur l'URL configurée
 */

import axios from 'axios';
import { ACCESS_TOKEN } from './token';

// URL de base de l'API - utilise VITE_API_URL si définie, sinon localhost par défaut
const apiUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : 'http://127.0.0.1:8000';

// Création de l'instance Axios avec configuration de base
const api = axios.create({
    baseURL: apiUrl,  // URL de base pour toutes les requêtes
})

// Intercepteur pour modifier les requêtes avant envoi
api.interceptors.request.use(
    (config) => {
        // Ajout du token JWT Bearer standard
        const accessToken = localStorage.getItem(ACCESS_TOKEN);
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;  // Header d'autorisation JWT
        }

        // Ajout du token Google OAuth
        const googleAccessToken = localStorage.getItem('GOOGLE_ACCESS_TOKEN');
        if (googleAccessToken){
            config.headers['X-Google-Access-Token'] = googleAccessToken;  // Header personnalisé pour Google
        }

        return config;  // Retourne la configuration modifiée
    },

    (error) => {
        // Gestion des erreurs de configuration de requête
        return Promise.reject(error);
    }
);

export default api;  // Export de l'instance Axios configurée
