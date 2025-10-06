/**
 * Fichier: frontend/src/components/CartContext.jsx
 *
 * Description (FR):
 * - Fournit un contexte React (CartContext) pour partager l'état du panier
 *   dans l'application (ajout, suppression, mise à jour de quantité, vidage).
 * - Synchronise le panier avec l'API backend via `fetchCart` et `updateCart`.
 * - Normalise les URLs d'images pour s'assurer que `item.image` est une URL
 *   absolue (préfixe `VITE_API_URL` si nécessaire), afin que les images soient
 *   affichées correctement dans le panier et lors du checkout.
 *
 * Interactions principales :
 * - Appels réseau : `frontend/src/components/CartActions.jsx` utilise `api.js`
 *   pour GET/PUT sur `api/cart/` (endpoints définis dans `api/views.py`).
 * - Les composants consommateurs (Cart.jsx, Checkout.jsx, Navbar.jsx) lisent
 *   `state.cart` et appellent les fonctions exposées par le contexte.
 */

import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { fetchCart, updateCart } from './CartActions';  // Fonctions pour les appels API panier

// Création du contexte pour le panier
const CartContext = createContext();

// Reducer pour gérer les actions sur le panier
const cartReducer = (state, action) => {
    switch (action.type) {
        case "SET_CART":
            return {...state, cart: action.payload };  // Définit le panier complet
        case "ADD_TO_CART":
            const existingProductIndex = state.cart.findIndex(item => item.id === action.payload.id);
            if (existingProductIndex >= 0) {
                // Produit existant - augmentation de la quantité
                const newCart = [...state.cart];
                newCart[existingProductIndex].quantity += action.payload.quantity;
                return {...state, cart: newCart };
            }else {
                // Nouveau produit - ajout au panier
                return {...state, cart: [...state.cart, action.payload] };
            }
        case "REMOVE_FROM_CART":
            return {
                ...state,
                cart: state.cart.filter(item => item.id !== action.payload.id)  // Suppression complète
            };
        case "REMOVE_QUANTITY":
            const itemIndex = state.cart.findIndex(item => item.id === action.payload.id);
            if (itemIndex >= 0) {
                const newCart = [...state.cart];
                if (newCart[itemIndex].quantity > 1) {
                    // Diminution de la quantité si > 1
                    newCart[itemIndex].quantity -= 1;
                    return {...state, cart: newCart };
                }else {
                    // Suppression si quantité = 1
                    return {
                        ...state, 
                        cart: state.cart.filter(item => item.id !== action.payload.id) };
                }
            }
            return state; // Si article non trouvé, retourne l'état actuel
        case "INCREASE_QUANTITY":
            const increaseItemIndex = state.cart.findIndex(item => item.id === action.payload.id);
            if (increaseItemIndex >= 0) {
                // Augmentation de la quantité
                const newCart = [...state.cart];
                newCart[increaseItemIndex].quantity += 1;
                return {...state, cart: newCart };
            }
            return state; // Si article non trouvé, retourne l'état actuel
        case "CLEAR_CART":
            return {...state, cart: [] };  // Vidage complet du panier
        default:
            return state;
    };
};

// Provider du contexte panier
export const CartProvider = ({ children }) => {
    const [state, dispatch] = useReducer(cartReducer, { cart: [] });  // Initialisation du reducer

    // Chargement initial du panier depuis l'API
    useEffect(() => {
        const getCart = async () => {
            const itmes = await fetchCart();
            // Normalisation des URLs d'images pour les articles venant du serveur
            const normalize = (img) => {
                if (!img) return null;
                if (img.startsWith('http://') || img.startsWith('https://')) return img;  // URL absolue déjà
                const base = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : 'http://127.0.0.1:8000';
                if (img.startsWith('/')) return `${base}${img}`;  // Chemin absolu avec base
                return `${base}/${img}`;  // Chemin relatif avec base
            };
            const normalized = (itmes || []).map(i => ({ ...i, image: normalize(i.image) }));
            dispatch({ type: "SET_CART", payload: normalized });
        };
        getCart();
    }, []);

    // Ajout d'un article au panier
    const addToCart = async (item) => {
        // Calcul du nouveau panier de manière déterministe pour synchronisation immédiate
        const existingProductIndex = state.cart.findIndex(i => i.id === item.id);
        let newCart;
        const quantityToAdd = item.quantity || 1;
        // Résolution de l'image en URL absolue pour éviter les images manquantes
        const resolveImage = (img) => {
            if (!img) return null;
            if (img.startsWith('http://') || img.startsWith('https://')) return img;
            const base = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : 'http://127.0.0.1:8000';
            if (img.startsWith('/')) return `${base}${img}`;
            return `${base}/${img}`;
        };
        const itemNormalized = { ...item, image: resolveImage(item.image) };
        if (existingProductIndex >= 0) {
            // Produit existant - mise à jour de la quantité
            newCart = [...state.cart];
            newCart[existingProductIndex] = { ...newCart[existingProductIndex], quantity: (newCart[existingProductIndex].quantity || 0) + quantityToAdd };
        } else {
            // Nouveau produit - ajout au panier
            newCart = [...state.cart, { ...itemNormalized, quantity: quantityToAdd }];
        }
        dispatch({ type: "SET_CART", payload: newCart });
        try {
            await updateCart(newCart);  // Synchronisation avec l'API
        } catch (e) {
            console.error('Failed to sync cart after add:', e);
        }
    };

    // Suppression d'un article du panier
    const removeFromCart = async (id) => {
        const newCart = state.cart.filter(item => item.id !== id);
        dispatch({ type: "SET_CART", payload: newCart });
        try {
            await updateCart(newCart);  // Synchronisation avec l'API
        } catch (e) {
            console.error('Failed to sync cart after remove:', e);
        }
    };

    // Diminution de la quantité d'un article
    const removeFromQuantityCart = async (id) => {
        const itemIndex = state.cart.findIndex(item => item.id === id);
        if (itemIndex < 0) return;
        const newCart = [...state.cart];
        if ((newCart[itemIndex].quantity || 0) > 1) {
            // Diminution si quantité > 1
            newCart[itemIndex] = { ...newCart[itemIndex], quantity: newCart[itemIndex].quantity - 1 };
        } else {
            // Suppression si quantité = 1
            newCart.splice(itemIndex, 1);
        }
        dispatch({ type: "SET_CART", payload: newCart });
        try {
            await updateCart(newCart);  // Synchronisation avec l'API
        } catch (e) {
            console.error('Failed to sync cart after decrease quantity:', e);
        }
    };

    // Augmentation de la quantité d'un article
    const increaseQuantityCart = async (id) => {
        const itemIndex = state.cart.findIndex(item => item.id === id);
        if (itemIndex < 0) return;
        const newCart = [...state.cart];
        newCart[itemIndex] = { ...newCart[itemIndex], quantity: (newCart[itemIndex].quantity || 0) + 1 };
        dispatch({ type: "SET_CART", payload: newCart });
        try {
            await updateCart(newCart);  // Synchronisation avec l'API
        } catch (e) {
            console.error('Failed to sync cart after increase quantity:', e);
        }
    };

    // Vidage complet du panier
    const clearCart = async () => {
        dispatch({ type: "SET_CART", payload: [] });
        try {
            await updateCart([]);  // Synchronisation avec l'API
        } catch (e) {
            console.error('Failed to sync cart after clear:', e);
        }
    };
    
    // Fourniture de l'état du panier et des actions au contexte
    return (
        <CartContext.Provider value={{ state, addToCart, removeFromCart, removeFromQuantityCart, increaseQuantityCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

// Hook personnalisé pour utiliser le contexte panier
export const useCart = () => {
    return useContext(CartContext);
};