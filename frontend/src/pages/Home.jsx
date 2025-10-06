/**
 * Fichier: Home.jsx (Page d'accueil)
 * 
 * Description (FR):
 * - Page d'accueil principale de l'application e-commerce
 * - Composant conteneur qui assemble les sections principales de la page d'accueil
 * - Affiche l'en-tête promotionnel et la liste des produits
 * 
 * Structure :
 * - Header : Section promotionnelle ou bannière principale
 * - Products : Liste des produits disponibles à l'achat
 * 
 * Connexions :
 * - Route principale '/' définie dans App.jsx
 * - Utilise les composants Header et Products pour l'affichage
 * - Point d'entrée principal pour les utilisateurs non authentifiés
 */

import React  from "react";
import Header from "../components/Header";
import Products from "../components/Products";

const Home = () => {
    return (
        <div>
            <Header />   {/* Section d'en-tête avec bannière promotionnelle */}
            <Products /> {/* Liste des produits disponibles */}
        </div>
    );
}

export default Home;