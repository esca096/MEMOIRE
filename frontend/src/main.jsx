/**
 * Fichier: main.jsx (ou le fichier point d'entrée React)
 * 
 * Description (FR):
 * - Point d'entrée principal de l'application React
 * - Initialise le rendu de l'application dans le DOM
 * - Configure les providers de contexte globaux
 * 
 * Fonctionnalités principales :
 * - Rend l'application React dans l'élément #root
 * - Active le mode StrictMode pour détecter les problèmes potentiels
 * - Fournit le contexte du panier (CartProvider) à toute l'application
 * 
 * Connexions :
 * - Utilise le composant racine App.jsx
 * - Intègre le CartProvider pour la gestion globale du panier
 * - Point de départ de l'arbre des composants React
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './components/CartContext.jsx'

// Rendu de l'application React dans l'élément HTML avec l'id 'root'
createRoot(document.getElementById('root')).render(
  <CartProvider>  {/* Fournit le contexte du panier à toute l'application */}
    <App />        {/* Composant racine de l'application */}
  </CartProvider>
)