/**
 * Fichier: frontend/src/components/Navbar.jsx
 *
 * Description (FR):
 * - Barre de navigation principale de l'application.
 * - Affiche le logo, liens statiques (Pourquoi, À propos, Contact) et les actions
 *   liées à l'utilisateur (connexion/déconnexion, lien vers le tableau de bord)
 * - Affiche aussi l'icône du panier avec le nombre d'articles, lu depuis `CartContext`.
 */

import React from "react";
import { Link } from "react-router-dom";  // Composant pour la navigation interne
import logo from "../assets/logo.png";  // Logo de l'application
import '../styles/Navbar.css';  // Styles CSS de la navbar
import { useAuthentication } from "../auth";  // Hook d'authentification personnalisé
import { useCart } from "./CartContext";  // Contexte du panier


function Navbar() {

    const { isAuthorized, logout } = useAuthentication();  // État d'authentification et fonction de déconnexion
    const {state} = useCart();  // Accès au contexte du panier
    const cart = state.cart || [];  // Récupération des articles du panier (avec fallback)

    // Gestion de la déconnexion utilisateur
    const handleLogout = () => {
        logout();  // Appel de la fonction de déconnexion du hook
    }

    return (
        <div className="navbar">
        {/* Logo cliquable vers la page d'accueil */}
        <Link to="/" className="navbar-logo-link">
            <img src={logo} alt="Logo" className="navbar-logo" />  {/* Logo de l'application */}
        </Link>
        
        {/* Menu de navigation gauche - liens statiques */}
        <ul className="navbar-menu-left">
            <li>
                <Link to="/why">Pourquoi nous ?</Link>  {/* Lien vers la page "Pourquoi nous" */}
            </li>
            <li>
                <Link to="/about">À propos</Link>  {/* Lien vers la page "À propos" */}
            </li>
            <li>
                <Link to="/contact">Contact</Link>  {/* Lien vers la page "Contact" */}
            </li>
        </ul>
        
        {/* Menu de navigation droite - actions utilisateur */}
        <ul className="navbar-menu-right">
            { isAuthorized ? (
                // Interface utilisateur connecté
                <>
                    {/* Icône tableau de bord */}
                    <li className="dashboard-icon">
                        <Link to="/dashboard">DB</Link>  {/* Lien vers le tableau de bord */}
                    </li>
                    {/* Icône panier avec compteur d'articles */}
                    <li className="cart-icon">
                        <Link to="/cart">
                            <span className="cart-count">{cart.length}</span>  {/* Affichage du nombre d'articles */}
                        </Link>
                    </li>
                    {/* Bouton de déconnexion */}
                    <li>
                        <Link onClick={handleLogout} to="/logout" className="button-link">Déconnexion</Link>  {/* Lien de déconnexion avec gestionnaire */}
                    </li>
                </>

            ) : (
                // Interface utilisateur non connecté
                <>
                    {/* Bouton de connexion */}
                    <li>
                        <Link to="/login" className="button-link-login">Se connecter</Link>  {/* Lien vers la page de connexion */}
                    </li>
                    {/* Bouton d'inscription */}
                    <li>
                        <Link to="/register" className="button-link">S'incrire</Link>  {/* Lien vers la page d'inscription */}
                    </li>
                </>
            )}
            
        </ul>
    </div>
    );
}

export default Navbar;