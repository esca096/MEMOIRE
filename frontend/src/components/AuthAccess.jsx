/**
 * Fichier: ProtectedRoute.jsx (Route protégée)
 * 
 * Description (FR):
 * - Composant de garde de route pour la protection des pages selon l'authentification
 * - Redirige les utilisateurs selon leur statut de connexion
 * - Empêche l'accès aux pages de login/register si déjà connecté
 * 
 * Fonctionnalités principales :
 * - Vérification de l'état d'authentification
 * - Redirection automatique des utilisateurs connectés depuis login/register
 * - Affichage d'un indicateur de chargement pendant la vérification
 * - Protection conditionnelle des routes enfants
 * 
 * Connexions :
 * - Utilise le hook useAuthentication pour l'état d'auth
 * - S'intègre avec React Router pour la navigation
 * - Protège les routes enfants en les encapsulant
 */

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthentication } from "../auth";

function ProtectedRoute({children}) {
    const {isAuthorized} = useAuthentication();  // État d'authentification depuis le hook

    // Affichage pendant la vérification de l'authentification
    if (isAuthorized === null) {
        return <div>Chargement..........</div>  // Indicateur de chargement
    }

    // Redirection si utilisateur déjà connecté et tente d'accéder à login/register
    if ( isAuthorized &&
        (window.location.pathname === "/login" || window.location.pathname === "/register") 
    ) {
        return <Navigate to="/" />;  // Redirection vers la page d'accueil
    }

    return children;  // Rendu des enfants si les conditions sont remplies
}
export default ProtectedRoute; 