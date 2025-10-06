/**
 * Fichier: frontend/src/components/Header.jsx
 *
 * Description (FR):
 * - Composant d'en-tête principal avec bannière promotionnelle
 * - Affiche une image de fond et un message d'accueil percutant
 * - Présente un appel à l'action pour inciter à l'achat
 * - Design visuel attractif pour capturer l'attention des visiteurs
 *
 * Fonctionnalités principales :
 * - Bannière hero avec image de fond immersive
 * - Message d'accueil et de valorisation
 * - Bouton d'appel à l'action pour débuter l'expérience d'achat
 * - Design responsive pour tous les appareils
 *
 * Connexions :
 * - Utilisé dans la page d'accueil (Home.jsx)
 * - Intègre une image d'arrière-plan depuis les assets
 * - Style cohérent avec le design global de l'application
 */

import React from "react";
import "../styles/Header.css";  // Styles CSS spécifiques au header
import bgwoman from "../assets/bg-woman.jpg";  // Image de fond importée


const Header = () => {
    return (
        <div className="header">
            <img src={bgwoman} alt="Background woman " className="header-bg" />  {/* Image de fond de la bannière */}
            <div className="header-content">
                <h1>Bienvenue sur notre site Web</h1>  {/* Titre principal d'accueil */}
                <h3>Achetez chez nous maintenant!</h3>  {/* Sous-titre incitatif */}
                <button> Commencer à acheter </button>  {/* Bouton d'appel à l'action */}
            </div>
        </div>
    );
}

export default Header;