/**
 * Fichier: AuthForm.jsx (Formulaire d'authentification)
 * 
 * Description (FR):
 * - Composant de formulaire réutilisable pour la connexion et l'inscription
 * - Gère l'authentification standard (username/password) et OAuth Google
 * - Affiche les erreurs et messages de succès appropriés
 * 
 * Fonctionnalités principales :
 * - Formulaire d'authentification standard avec validation
 * - Intégration OAuth Google avec redirection
 * - Gestion des états de chargement et d'erreur
 * - Basculer entre les modes login et register
 * - Stockage des tokens JWT après connexion réussie
 * 
 * Connexions :
 * - Utilisé par AuthPage.jsx pour l'affichage des formulaires
 * - Communique avec l'API Django pour l'authentification
 * - Intègre avec React Router pour la navigation
 * - Stocke les tokens dans le localStorage pour la persistance
 */

import api from "../api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../token";
import "../styles/AuthForm.css";
import google from "../assets/google.png";

const AuthForm = ({ route, method}) => {
    const [username, setUsername] = useState("");  // State pour le nom d'utilisateur
    const [password, setPassword] = useState("");  // State pour le mot de passe
    const [loading, setLoading] = useState(false);  // State pour l'indicateur de chargement
    const [error, setError] = useState(null);  // State pour les messages d'erreur
    const [success, setSuccess] = useState(null);  // State pour les messages de succès
    const navigate = useNavigate();  // Hook pour la navigation

    // Soumission du formulaire d'authentification
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await api.post(route, {
                username,
                password,
            });

            if (method === "login") {
                // Connexion réussie - stockage des tokens
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                navigate("/dashboard");  // Redirection vers le tableau de bord
                window.location.reload();  // Rechargement pour mettre à jour l'état d'authentification
            } else {
                // Inscription réussie - message de succès
                setSuccess("Registration successful! You can now log in.");
                setTimeout(() => {
                    navigate("/login");  // Redirection vers la page de connexion après délai
                }, 2000)
                    
            }
        }   catch (error) {
                console.error(error);
                // Gestion détaillée des erreurs HTTP
                if (error.response) {
                    if (error.response.status === 401) {
                        setError("Invalid crudentials");  // Identifiants invalides
                    } else if (error.response.status === 400) {
                        setError("Username already exists");  // Nom d'utilisateur déjà existant
                    }else {
                        setError("Something went wrong. Please try again.");  // Autre erreur serveur
                    }
                }else if (error.request) {
                    setError("Network error. Please check your connection.");  // Erreur réseau
                }else {
                    setError("Something went wrong. Please try again.");  // Erreur inconnue
                }
        }   finally {
            setLoading(false);  // Arrêt de l'indicateur de chargement
        }
       
    };

    // Redirection vers l'authentification Google OAuth
    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8000/accounts/google/login/";  // URL OAuth Google
    };

    return (
        <div className="form-container">
            {loading && (
                <div className="loading-indicator">
                    {error ? <span className="error-message">{error}</span> : <div className="spinner"></div>}  {/* Indicateur de chargement ou erreur */}
                </div>
            )}
            {!loading &&(
                <form onSubmit={handleSubmit} className="form">
                    <h2>{method === 'register' ? "Inscription" : "Connexion"}</h2>  {/* Titre dynamique */}
                    {error && <div className="error-message">{error}</div>}  {/* Affichage des erreurs */}
                    {success && <div className="success-message">{success}</div>}  {/* Affichage des succès */}
                    <div className="form-group">
                        <label htmlFor="username">Nom d'utilisateur:</label>
                        <input 
                            type="text" 
                            id="username" 
                            value={username} onChange={e => setUsername(e.target.value)} 
                            required />  {/* Champ nom d'utilisateur */}
                    </div>
                    <div className="form-group">
                        <label htmlFor="username">Mot de passe:</label>
                        <input 
                            type="password" 
                            id="password" 
                            value={password} onChange={e => setPassword(e.target.value)} 
                            required />  {/* Champ mot de passe */}
                    </div>
                    <button type="submit" className="form-button">
                        {method === 'register' ? "S'inscrire" : "Se connecter"}  {/* Bouton soumission dynamique */}
                    </button>
                    <button type="button" className="google-button" onClick={handleGoogleLogin}>
                        <img src={google} alt="Google icon" className="google-icon" />  {/* Icône Google */}
                        {method === 'register' ? "S'inscrire avec Google" : "Se connecter avec Google"}  {/* Texte bouton Google dynamique */}
                    </button>
                    {method === 'login' && (
                        <p className="toggle-text">Vous n&apos;avez pas de compte ? 
                            <span className="toggle-link" onClick={() => navigate("/register")}>S'inscrire</span>  {/* Lien vers inscription */}
                        </p>
                    )}
                    {method === 'register' && (
                        <p className="toggle-text">Vous avez déjà un compte ? 
                            <span className="toggle-link" onClick={() => navigate("/login")}>Se connecter</span>  {/* Lien vers connexion */}
                        </p>
                    )}
                </form>
            )}
        </div>
    );
}

export default AuthForm;