/**
 * Fichier: frontend/src/components/Cart.jsx
 *
 * Description (FR):
 * - Affiche le contenu du panier (items stockés dans `CartContext`).
 * - Permet d'augmenter/diminuer la quantité, supprimer un article, vider le panier
 *   et d'accéder à la page de checkout.
 * - Affiche `item.image` tel qu'il est fourni par le contexte (doit être une URL absolue).
 *
 * Interactions principales :
 * - Appelle les méthodes du contexte (`removeFromCart`, `increaseQuantityCart`, etc.)
 *   qui synchronisent ensuite avec l'API `api/cart/`.
 */

import React from 'react';
import { useCart } from './CartContext';  // Hook du contexte panier
import { useNavigate } from 'react-router-dom';  // Hook pour la navigation
import '../styles/Cart.css';

const Cart = () => {
    const {state: {cart}, removeFromCart, removeFromQuantityCart, increaseQuantityCart, clearCart} = useCart();  // Destructuration du contexte panier
    const navigate = useNavigate();  // Hook pour la navigation programmatique

    // Suppression complète d'un article du panier
    const handleRemove = (id) => {
        removeFromCart(id);
    };

    // Diminution de la quantité d'un article
    const handleDecreaseQuantity = (id) => {
        removeFromQuantityCart(id);
    };

    // Augmentation de la quantité d'un article
    const handleIncreaseQuantity = (id) => {
        increaseQuantityCart(id);
    };

    // Vidage complet du panier
    const handleClearCart = () => {
        clearCart();
    };

    // Redirection vers la page de paiement
    const handleCheckout = () => {
        navigate('/checkout');  // Navigation vers la page checkout
    }

    // Affichage si le panier est vide
    if (cart.length === 0) {
        return <p>Votre panier est vide...</p>
    }

    return (
        <div className='cart-container'>
            <h1>Votre panier</h1>
            <div className='cart-items'>
                {cart.map((item) => (
                    <div key={item.id} className='cart-item'>
                        <img 
                            src={item.image}  // URL de l'image du produit
                            alt={item.name}
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}  // Style d'image fixe
                        />
                        <div className='cart-item-info'>
                            <h2>{item.name}</h2>  {/* Nom du produit */}
                            <p><strong>Prix:</strong> {item.price} XOF</p>  {/* Prix unitaire */}
                            <p><strong>Quantite:</strong> {item.quantity}</p>  {/* Quantité actuelle */}
                            <button onClick={() => handleIncreaseQuantity(item.id)} className='increase-btn'>
                                Augmenter  {/* Bouton augmentation quantité */}
                            </button>
                            <button onClick={() => handleDecreaseQuantity(item.id)} className='decrease-btn'>
                                Diminuer  {/* Bouton diminution quantité */}
                            </button>
                            <button onClick={() => handleRemove(item.id)} className='remove-btn'>
                                Retirer  {/* Bouton suppression article */}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className='cart-actions'>
                <button onClick={handleClearCart} className='clear-cart-btn'>Vider le panier</button>  {/* Bouton vider panier */}
                <p><strong>Total:</strong>XOF{cart.reduce((total, item) => total + item.price * item.quantity, 0)}</p>  {/* Calcul du total */}
                <button onClick={handleCheckout} className='checkout-btn'>Passer à la caisse</button>  {/* Bouton checkout */}
            </div>
        </div>
    );
};
export default Cart;