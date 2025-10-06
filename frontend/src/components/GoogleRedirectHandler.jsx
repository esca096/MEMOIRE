/**
 * Fichier: frontend/src/components/GoogleRedirectHandler.jsx
 *
 * Description (FR):
 * - Composant de gestion de la redirection OAuth Google après authentification
 * - Récupère le token d'accès depuis les paramètres URL et le stocke localement
 * - Vérifie la validité du token avec le backend avant de rediriger
 * - Gère les erreurs d'authentification et les redirections appropriées
 *
 * Fonctionnalités principales :
 * - Extraction du token Google depuis l'URL de callback
 * - Stockage sécurisé du token dans le localStorage
 * - Validation du token avec l'API backend
 * - Redirection vers la page d'accueil ou de login selon le résultat
 *
 * Connexions :
 * - Appelé par la route '/login/callback' dans App.jsx
 * - Communique avec l'endpoint '/api/auth/user/' pour la validation
 * - Utilise le système de navigation React Router
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";  // Hook pour la navigation programmatique
import axios from "axios";  // Client HTTP pour la validation du token
import { GOOGLE_ACCESS_TOKEN } from "../token";  // Constante pour la clé de stockage

function RedirectGoogleAuth(){
    const navigate = useNavigate();  // Hook pour la navigation

    useEffect(() => {
        console.log("RedirectHandler mounted successfully");  // Log de débogage
        const queryParams = new URLSearchParams(window.location.search);  // Extraction des paramètres URL
        const accessToken = queryParams.get("access_token");  // Récupération du token d'accès
        console.log("QueryParams: ", window.location.search);  // Log des paramètres

        if (accessToken) {
            console.log("AccessToken found: ", accessToken);  // Log du token trouvé
            localStorage.setItem(GOOGLE_ACCESS_TOKEN, accessToken);  // Stockage sécurisé du token

            // Configuration du header Authorization pour la vérification
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            
            // Vérification de la validité du token avec le backend
            axios.get('http://localhost:8000/api/auth/user/')
                .then(response => {
                    console.log('User data: ', response.data);  // Log des données utilisateur
                    navigate('/');  // Redirection vers la page d'accueil après succès
                })
                .catch(error => {
                    console.error('Error verifying token: ', error.response ? error.response.data : error.message);  // Log d'erreur détaillé
                    navigate('/login');  // Redirection vers la page de login en cas d'erreur
                })
        } else {
            console.log('No token found in URL');  // Log si aucun token trouvé
            navigate('/login');  // Redirection vers la page de login
        }
    }, [navigate])  // Dépendance sur navigate pour éviter les warnings

    return <div>logging In.............</div>  // Message d'attente pendant le traitement
}

export default RedirectGoogleAuth;