/**
 * Fichier: frontend/src/components/Navbar.jsx
 * 
 * Description (FR):
 * - Barre de navigation principale avec système de recherche intégré
 * - Recherche en temps réel avec suggestions de produits
 * - Gestion du menu mobile (popover) avec bouton hamburger
 */

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import logo from "../assets/logo.png"; 
import '../styles/Navbar.css'; 
import { useAuthentication } from "../auth"; 
import { useCart } from "./CartContext"; 
// import { searchProducts } from "../api"; // Chemin correct vers votre fichier api.js

function Navbar() {
    const { isAuthorized, logout } = useAuthentication(); 
    const { state } = useCart(); 
    const cart = state.cart || []; 
    const [open, setOpen] = useState(false); 
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchRef = useRef(null);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout(); 
    }

    const handleMobileLogout = () => {
        logout(); 
        setOpen(false); 
    }

    // Recherche en temps réel
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.trim().length > 2) {
                performSearch(searchQuery);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // Fermer les suggestions en cliquant à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const performSearch = async (query) => {
        setIsLoading(true);
        try {
            const results = await searchProducts(query);
            setSuggestions(results);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Erreur recherche:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setShowSuggestions(false);
            setSearchQuery("");
        }
    };

    const handleSuggestionClick = (product) => {
        navigate(`/product/${product.id}`);
        setShowSuggestions(false);
        setSearchQuery("");
    };

    const clearSearch = () => {
        setSearchQuery("");
        setSuggestions([]);
        setShowSuggestions(false);
    };

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
                
                {/* BARRE DE RECHERCHE */}
                
                    {/* Suggestions de recherche */}
                    
                
                {/* Menu de navigation droite - actions utilisateur */}
                <ul className="navbar-menu-right">
                    { isAuthorized ? (
                        // Interface utilisateur connecté
                        <>
                            {/* Icône tableau de bord */}
                            <li className="dashboard-icon">
                                <Link to="/dashboard">📊</Link>
                            </li>
                            {/* Icône Panier */}
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
                                <Link to="/register" className="button-link">S'inscrire</Link>
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

                                {/* Barre de recherche mobile */}
                                

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
