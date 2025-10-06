/**
 * Fichier: useAuthentication.js (Custom Hook React)
 * 
 * Description (FR):
 * - Hook personnalisé pour la gestion de l'authentification dans l'application
 * - Vérifie et maintient l'état d'authentification de l'utilisateur
 * - Gère à la fois l'authentification JWT standard et OAuth Google
 * 
 * Fonctionnalités principales :
 * - Vérification de la validité des tokens JWT et Google
 * - Rafraîchissement automatique des tokens JWT expirés
 * - Validation des tokens Google avec le backend
 * - Logout et nettoyage des tokens
 * 
 * Connexions :
 * - Utilise les services API définis dans api.js
 * - Interagit avec le localStorage pour la persistance des tokens
 * - Fournit l'état d'authentification aux composants consommateurs
 */

import { useState, useEffect } from "react";
import {jwtDecode} from "jwt-decode";
import api from "./api";
import { ACCESS_TOKEN, REFRESH_TOKEN, GOOGLE_ACCESS_TOKEN } from "./token";

export const useAuthentication = () => {
    const [isAuthorized, setIsAuthorized] = useState(false);  // État d'authentification

    useEffect(() => {
        const auth = async () => {
            const token = localStorage.getItem(ACCESS_TOKEN);  // Token JWT standard
            const googleAccessToken = localStorage.getItem(GOOGLE_ACCESS_TOKEN)  // Token Google OAuth

            console.log('ACCESS_TOKEN', token);
            console.log('GOOGLE_ACCESS_TOKEN', googleAccessToken);

            if (token) {
                // Vérification du token JWT
                const decode = jwtDecode(token);
                const tokenExpiration = decode.exp  // Timestamp d'expiration
                const now = Date.now() / 1000;  // Timestamp actuel

                if (tokenExpiration < now) {
                    // Token expiré - tentative de rafraîchissement
                    await refreshToken();
                } else {
                    // Token valide
                    setIsAuthorized(true);
                }
            } else if (googleAccessToken) {
                // Vérification du token Google OAuth
                const isGoogleTokenValid = await validateGoogleToken(googleAccessToken);
                console.log('Google token valid:', isGoogleTokenValid);
                if (isGoogleTokenValid) {
                    setIsAuthorized(true);
                } else {
                    setIsAuthorized(false);
                }
            } else {
                // Aucun token trouvé
                setIsAuthorized(false);
            }
        };
        auth().catch(() => setIsAuthorized(false));  // Gestion des erreurs d'authentification
    }, []);

    const refreshToken = async () => {
        // Rafraîchissement du token JWT expiré
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        try {
            const res = await api.post('api/token/refresh/', {
                refresh: refreshToken,
            });
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);  // Nouveau token d'accès
                setIsAuthorized(true);
            } else {
                setIsAuthorized(false);
            }
        } catch (error){
            console.error("Error refreshing token:", error);
            setIsAuthorized(false);
        }
    };

    const validateGoogleToken = async (googleAccessToken) => {
        // Validation du token Google avec le backend
        try {
            const res = await api.post('api/google/validate_token/', {
                access_token: googleAccessToken,
            }, 
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        console.log("Validate response: ", res.data);
        return res.data.valid;  // Retourne la validité du token
        } catch (error) {
            console.error("Error validating Google token:", error);
            return false;
        }
    }

    const logout = () => {
        // Déconnexion et nettoyage des tokens
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(GOOGLE_ACCESS_TOKEN);
        setIsAuthorized(false);
        window.location.reload();  // Rechargement pour réinitialiser l'état
    }

    return { isAuthorized, logout};  // Interface du hook
}