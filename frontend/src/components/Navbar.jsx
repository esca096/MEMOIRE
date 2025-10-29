/**
 * Fichier: frontend/src/components/Navbar.jsx
 *
 * Description (FR):
 * - Barre de navigation principale de l'application.
 * - Inclut la gestion du menu mobile (popover) avec un bouton hamburger.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom"; 
import logo from "../assets/logo.png"; 
import '../styles/Navbar.css'; 
import { useAuthentication } from "../auth"; 
import { useCart } from "./CartContext"; 

function Navbar() {
    const { isAuthorized, logout } = useAuthentication(); 
    const {state} = useCart(); 
    const cart = state.cart || []; 
    const [open, setOpen] = useState(false); 

    const handleLogout = () => {
        logout(); 
    }

    const handleMobileLogout = () => {
        logout(); 
        setOpen(false); 
    }

    return (
        <>
            <div className="navbar">
                
                {/* Logo cliquable vers la page d'accueil */}
                <Link to="/" className="navbar-logo-link">
                    <img src={logo} alt="Logo" className="navbar-logo" /> 
                </Link>
                
                {/* Menu de navigation gauche - liens statiques */}
                <ul className="navbar-menu-left">
                    <li><Link to="/why">Pourquoi nous ?</Link></li>
                    <li><Link to="/about">À propos</Link></li>
                    <li><Link to="/contact">Contact</Link></li>
                </ul>
                
                {/* Menu de navigation droite - actions utilisateur */}
                <ul className="navbar-menu-right">
                    { isAuthorized ? (
                        // Interface utilisateur connecté
                        <>
                            {/* Icône tableau de bord */}
                            <li className="dashboard-icon">
                                <Link to="/dashboard">📊</Link>
                            </li>
                            {/* NOUVELLE ICÔNE PANIER AVEC ICÔNE VISUELLE */}
                            <li className="cart-icon">
                                <Link to="/cart" className="cart-link">
                                    🛒
                                    <span className="cart-count">{cart.length}</span>
                                </Link>
                            </li>
                            {/* Bouton de déconnexion */}
                            <li>
                                <Link onClick={handleLogout} to="/logout" className="button-link">Déconnexion</Link>
                            </li>
                        </>

                    ) : (
                        // Interface utilisateur non connecté
                        <>
                            <li>
                                <Link to="/login" className="button-link-login">Se connecter</Link>
                            </li>
                            <li>
                                <Link to="/register" className="button-link">S'incrire</Link>
                            </li>
                        </>
                    )}
                </ul>

                {/* Bouton Hamburger */}
                <div className="hamburger-container">
                    <button 
                        className="navbar-hamburger" 
                        onClick={() => setOpen(!open)}
                        aria-expanded={open}
                        aria-label="Toggle navigation"
                    >
                        {open ? '✕' : '☰'} 
                    </button>
                    
                    {/* Popover mobile */}
                    {open && (
                        <div className="navbar-popover">
                            <ul>
                                <li><Link to="/why" onClick={() => setOpen(false)}>Pourquoi nous ?</Link></li>
                                <li><Link to="/about" onClick={() => setOpen(false)}>À propos</Link></li>
                                <li><Link to="/contact" onClick={() => setOpen(false)}>Contact</Link></li>

                                { isAuthorized ? (
                                    <>
                                        <li><Link to="/dashboard" onClick={() => setOpen(false)}>📊 Tableau de bord</Link></li>
                                        <li>
                                            <Link to="/cart" onClick={() => setOpen(false)}>
                                                🛒 Panier ({cart.length})
                                            </Link>
                                        </li>
                                        <li>
                                            <Link 
                                                to="/logout" 
                                                onClick={handleMobileLogout}
                                            >
                                                Déconnexion
                                            </Link>
                                        </li>
                                    </>
                                ) : (
                                    <>
                                        <li><Link to="/login" onClick={() => setOpen(false)}>Se connecter</Link></li>
                                        <li><Link to="/register" onClick={() => setOpen(false)}>S'inscrire</Link></li>
                                    </>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Navbar;
