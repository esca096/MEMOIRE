/**
 * Fichier: frontend/src/components/Footer.jsx
 *
 * Description (FR):
 * - Composant de pied de page réutilisable sur toutes les pages du site
 * - Contient les liens principaux, les informations de contact et une newsletter
 * - Design responsive avec sections organisées pour une navigation facile
 * 
 * Fonctionnalités principales :
 * - Liens de navigation vers les pages importantes du site
 * - Formulaire d'inscription à la newsletter (côté client uniquement)
 * - Liens vers les réseaux sociaux
 * - Informations légales et copyright
 * 
 * Connexions :
 * - Utilise React Router pour les liens internes
 * - Design cohérent avec le reste de l'application
 * - Présent sur toutes les pages via App.jsx
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';  // Composant Link pour la navigation interne
import '../styles/Footer.css';  // Styles CSS spécifiques au footer

const Footer = () => {
  const [email, setEmail] = useState('');  // State pour l'email de newsletter
  const [subscribed, setSubscribed] = useState(false);  // State pour le statut d'inscription

  // Gestion de l'inscription à la newsletter
  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    // Côté client uniquement : à l'avenir on pourra POST vers une API
    setSubscribed(true);  // Confirmation d'inscription
  }

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Colonne "À propos" avec description et réseaux sociaux */}
        <div className="footer-col about">
          <h4>TechShop</h4>
          <p>La boutique tech pour tous vos besoins — smartphones, laptops, accessoires et plus.</p>  {/* Description de l'entreprise */}
          <div className="socials">
            <a href="#" aria-label="facebook">Facebook</a>  {/* Lien Facebook */}
            <a href="#" aria-label="twitter">Twitter</a>    {/* Lien Twitter */}
            <a href="#" aria-label="instagram">Instagram</a>  {/* Lien Instagram */}
          </div>
        </div>

        {/* Colonne des liens utiles */}
        <div className="footer-col links">
          <h4>Liens utiles</h4>
          <ul>
            <li><Link to="/">Accueil</Link></li>           {/* Lien vers la page d'accueil */}
            <li><Link to="/why">Pourquoi nous ?</Link></li>  {/* Lien vers la page "Pourquoi nous" */}
            <li><Link to="/about">À propos</Link></li>     {/* Lien vers la page "À propos" */}
            <li><Link to="/contact">Contact</Link></li>    {/* Lien vers la page de contact */}
          </ul>
        </div>

        {/* Colonne newsletter */}
        <div className="footer-col newsletter">
          <h4>Bulletin</h4>
          <p>Recevez nos promos et nouveautés directement par email.</p>  {/* Description newsletter */}
          {!subscribed ? (
            // Formulaire d'inscription à la newsletter
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <input
                type="email"
                placeholder="Votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}  // Mise à jour de l'email
                required
              />
              <button type="submit">S'inscrire</button>  {/* Bouton d'inscription */}
            </form>
          ) : (
            // Message de confirmation après inscription
            <div className="subscribed">Merci ! Vous êtes inscrit.</div>
          )}
        </div>
      </div>

      {/* Section inférieure du footer avec copyright et liens légaux */}
      <div className="footer-bottom">
        <div>© {new Date().getFullYear()} TechShop — Tous droits réservés</div>  {/* Copyright avec année dynamique */}
        <div className="footer-bottom-links">
          <Link to="/">CGV</Link>                                  {/* Lien Conditions Générales de Vente */}
          <Link to="/">Mentions légales</Link>                     {/* Lien Mentions légales */}
          <Link to="/">Politique de confidentialité</Link>         {/* Lien Politique de confidentialité */}
        </div>
      </div>
    </footer>
  );
}

export default Footer;