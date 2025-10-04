import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    // client-side only: in future we can POST to an API
    setSubscribed(true);
  }

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-col about">
          <h4>TechShop</h4>
          <p>La boutique tech pour tous vos besoins — smartphones, laptops, accessoires et plus.</p>
          <div className="socials">
            <a href="#" aria-label="facebook">Facebook</a>
            <a href="#" aria-label="twitter">Twitter</a>
            <a href="#" aria-label="instagram">Instagram</a>
          </div>
        </div>

        <div className="footer-col links">
          <h4>Liens utiles</h4>
          <ul>
            <li><Link to="/">Accueil</Link></li>
            <li><Link to="/why">Pourquoi nous ?</Link></li>
            <li><Link to="/about">À propos</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        <div className="footer-col newsletter">
          <h4>Bulletin</h4>
          <p>Recevez nos promos et nouveautés directement par email.</p>
          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <input
                type="email"
                placeholder="Votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">S'inscrire</button>
            </form>
          ) : (
            <div className="subscribed">Merci ! Vous êtes inscrit.</div>
          )}
        </div>
      </div>

      <div className="footer-bottom">
        <div>© {new Date().getFullYear()} TechShop — Tous droits réservés</div>
        <div className="footer-bottom-links">
          <Link to="/">CGV</Link>
          <Link to="/">Mentions légales</Link>
          <Link to="/">Politique de confidentialité</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
