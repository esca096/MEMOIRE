/**
 * Fichier: frontend/src/components/Checkout.jsx
 *
 * Description (FR):
 * - Page de vérification/checkout. Récupère les informations du panier depuis
 *   `CartContext`, collecte l'adresse client et crée une commande via
 *   l'endpoint `api/orders/new/`.
 * - Envoie la liste `products` (avec `name`, `price`, `quantity`, `image`) vers le backend
 *   qui stocke la commande. Après succès, le panier est vidé et l'utilisateur
 *   est redirigé vers la confirmation de commande.
 *
 * Remarque : le champ `image` fait partie des items du panier et doit être une
 * URL absolue afin d'être réutilisable dans tout le flux de commande.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // Hook pour la navigation
import { useCart } from './CartContext';  // Contexte panier
import api from '../api';  // Client API Axios
import "../styles/Checkout.css";  // Styles CSS pour la page checkout

const Checkout = () => {
    const {state: {cart}, clearCart} = useCart();  // Récupération du panier et fonction de vidage
    const navigate = useNavigate();  // Hook pour la navigation programmatique

    // State pour les informations client (adresse de livraison)
    const [customerInfo, setCustomerInfo] = useState({
        address: '',
        city: '',
        country: '',
    });

    // Gestion des changements dans les champs du formulaire
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCustomerInfo({...customerInfo, [name]: value });  // Mise à jour du state
    }

    // Soumission du formulaire de commande
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validation des champs obligatoires
        if (!customerInfo.address || !customerInfo.city || !customerInfo.country) {
            console.error("All fields are required");
            return;
        }
        try {
            // Création de la commande via l'API
            const response = await api.post('api/orders/new/', {
                address: customerInfo.address,
                city: customerInfo.city,
                country: customerInfo.country,
                products: cart.map(item => ({
                    ...item,
                    price: parseFloat(item.price),  // Conversion du prix en float
                }))
            });
            console.log("Order Response", response.data);

            if (response.status === 201) {
                clearCart();  // Vidage du panier après commande réussie
                navigate(`/order-confirmation/${response.data.id}`);  // Redirection vers la confirmation
            }
        }catch (err) {
            console.error("Error creating order:", err);  // Gestion des erreurs
        }
    }

    // Vérification si le panier est vide
    if (!cart || cart.length === 0) {
        return  <p>Votre panier est vide, veuillez ajouter des produits pour procéder au paiement..</p>
    }

    return (
        <div className="checkout-container">
            <h1>Vérifier</h1>
            <form onSubmit={handleSubmit} className="checkout-form">

                {/* Champ adresse */}
                <input
                    type="text"
                    name="address"
                    value={customerInfo.address}
                    onChange={handleInputChange}
                    placeholder='Addresse'
                    className='checkout-input'
                    required
                />
                    
                {/* Champ ville */}
                <input
                    type="text"
                    name="city"
                    value={customerInfo.city}
                    onChange={handleInputChange}
                    placeholder='ville'
                    className='checkout-input'
                    required
                />
                 
                {/* Champ pays */}
                <input
                    type="text"
                    name="country"
                    value={customerInfo.country}
                    onChange={handleInputChange}
                    placeholder='Pays'
                    className='checkout-input'
                    required
                />

                {/* Récapitulatif de la commande */}
                <h3> Récapitulatif de la commande</h3>
                <ul className='order-summary'>
                    {cart.map((item) => (
                        <li key={item.id} className='order-item'>
                            {item.name} - {item.price} XOF x {item.quantity}  {/* Détail de chaque article */}
                        </li>
                    ))}
                </ul>
                {/* Calcul et affichage du prix total */}
                <p className='total-price'> Total: 
                    {cart.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)} XOF
                </p>
                {/* Bouton de soumission de commande */}
                <button type="submit" className="checkout-buton">Passer la commande</button>
            </form>
        </div>
    );
};

export default Checkout;