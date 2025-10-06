/**
 * Fichier: AuthPage.jsx (Page d'authentification)
 * 
 * Description (FR):
 * - Page conteneur pour l'authentification utilisateur (connexion/inscription)
 * - Gère le state pour basculer entre les modes login et register
 * - Passe les propriétés appropriées au composant AuthForm
 * 
 * Fonctionnalités :
 * - Reçoit la méthode initiale (login/register) depuis les routes
 * - Détermine la route API appropriée selon la méthode
 * - Transmet les configurations au composant AuthForm
 * 
 * Connexions :
 * - Utilisé par les routes protégées '/login' et '/register' dans App.jsx
 * - Passe les props au composant AuthForm pour le rendu du formulaire
 * - Communique avec le backend via les routes d'API définies
 */

import { useState, useEffect } from "react";
import AuthForm from "../components/AuthForm";

const AuthPage = ({ initialMethod }) => {
    const [method, setMethod] = useState(initialMethod);  // 'login' ou 'register'

    // Synchronise la méthode quand la prop initialMethod change
    useEffect(() => {
        setMethod(initialMethod);
    }, [initialMethod]);

    // Détermine la route API selon la méthode d'authentification
    const route = method === 'login' ? '/api/token/' : '/api/user/register/';

    return (
        <div>
            <AuthForm route={route} method={method} />  {/* Composant de formulaire d'authentification */}
        </div>
    );
};

export default AuthPage;