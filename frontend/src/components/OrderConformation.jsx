/**
 * Fichier: frontend/src/components/OrderConfirmation.jsx
 *
 * Description (FR):
 * - Page de confirmation de commande avec intégration Stripe pour le paiement
 * - Affiche les détails de la commande et permet le paiement en ligne
 * - Gère le flux de paiement complet avec confirmation et redirection
 * - Intègre les éléments de paiement Stripe de manière sécurisée
 *
 * Fonctionnalités principales :
 * - Affichage détaillé de la commande (utilisateur, adresse, produits, total)
 * - Intégration Stripe Elements pour le traitement des cartes
 * - Confirmation de paiement et mise à jour du statut de commande
 * - Redirection automatique vers les avis après paiement réussi
 *
 * Connexions :
 * - API backend pour les détails de commande et traitement des paiements
 * - Stripe.js pour le traitement sécurisé des paiements
 * - React Router pour la navigation et les paramètres d'URL
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';  // Hooks pour les paramètres URL et navigation
import { loadStripe } from '@stripe/stripe-js';  // Chargement de Stripe
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';  // Composants Stripe React
import api from '../api';  // Client API Axios
import "../styles/OrderConfirmation.css";  // Styles CSS de la confirmation

// Chargement de la clé publique Stripe depuis les variables d'environnement
const STRIPE_PUB_KEY = import.meta.env.VITE_STRIPE_PUB_KEY
console.log(STRIPE_PUB_KEY)
const stripePromise = loadStripe(STRIPE_PUB_KEY)

// Composant de formulaire de paiement Stripe
const PaymentForm = ({clientSecret, orderId, orderDetails}) => {
    const stripe = useStripe();  // Instance Stripe
    const elements = useElements();  // Éléments de formulaire Stripe
    const [loading, setLoading] = useState(false);  // État de chargement du paiement
    const [error, setError] = useState(null);  // Gestion des erreurs de paiement
    const [paymentSuccess, setPaymentSuccess] = useState(false);  // Statut de succès du paiement

    const navigate = useNavigate();  // Hook pour la navigation

    // Soumission du formulaire de paiement
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!stripe || !elements) return;  // Vérification de la disponibilité de Stripe

        const card = elements.getElement(CardElement);  // Récupération de l'élément carte

        // Confirmation du paiement par carte
        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: card,
                billing_details: {
                    name: orderDetails?.user.username || 'Custmer Paying'  // Nom du client pour la facturation
                },
            },
        })

        if (result.error) {
            setError(result.error.message);  // Gestion des erreurs de paiement
            setLoading(false);
        } else {
            if (result.paymentIntent.status === 'succeeded') {
                const paymentId = result.paymentIntent.id; // Extraction de l'ID de paiement

                // Marquage de la commande comme payée avec l'ID de paiement
                await api.post(`api/orders/${orderId}/mark_paid/`,{
                    payment_id: paymentId,  // Envoi de l'ID de paiement au backend
                })

                setPaymentSuccess(true);  // Mise à jour du statut de succès
            }
            setLoading(false);
        }
    };

    // Redirection automatique après paiement réussi
    useEffect(() => {
        if (paymentSuccess) {
            setTimeout(() => {
                navigate(`/reviews/${orderId}`);  // Redirection vers la page d'avis
            }, 3000); // Redirection après 3 secondes vers la page d'avis
        }
    }, [paymentSuccess, navigate, orderId]);

    return (
        <div className="payment-form">
            {paymentSuccess ? (
                // Message de succès après paiement
                <h3 className='success-message'>Paiement réussi! Votre commande est confirmée.</h3>
            ) : (
                // Formulaire de paiement Stripe
                <form onSubmit={handleSubmit} className='payment-form__form'>
                    <CardElement 
                        className="card-element"
                        options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#32325d',
                                    fontFamily: 'Arial, sans-serif',
                                    '::placeholder': {
                                        color: '#aab7c4',
                                    },
                                    padding: '10px',
                                    border: '1px solid #aab7c4',
                                    borderRadius: '4px',
                                    transition: 'border-color 0.3s ease',
                                    },
                                invalid: {
                                    color: '#fa755a',
                                    iconColor: '#fa755a',
                                },
                            },
                        }}  
                    />
                    <button type="submit" disabled={!stripe || loading} className="submit-button">
                        {loading ? 'Processing...' : 'Pay Now'}  {/* Bouton de paiement avec état de chargement */}
                        {error && <p className='error-message'>{error}</p>}  {/* Affichage des erreurs */}
                    </button>
                </form>
            )}
        </div>
    );
};


// Composant principal de confirmation de commande
const OrderConfirmation = () => {
    const {id} = useParams();  // Récupération de l'ID de commande depuis l'URL
    const [orderDetails, setOrderDetails] = useState(null);  // Détails de la commande
    const [loading, setLoading] = useState(true);  // État de chargement
    const [error, setError] = useState('');  // Gestion des erreurs
    const [clientSecret, setClientSecret] = useState('');  // Secret client Stripe pour le paiement
    // Intégration iPay retirée de l'interface pour le moment

    // Récupération des détails de la commande et préparation du paiement
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await api.get(`api/orders/${id}/`);
                setOrderDetails(response.data);
                if (response.data.status !== 'COMPLETED') {
                    // Préparation du clientSecret Stripe comme avant
                    try {
                        const paymentResponse = await api.post(`api/orders/${id}/create_payment_intent`);
                        setClientSecret(paymentResponse.data.clientSecret);  // Stockage du secret client
                    } catch (err) {
                        // Ignore si Stripe n'est pas configuré ou a échoué
                        console.warn('Stripe create intent failed', err);
                    }
                }
            } catch (error) {
                setError(error.message);
                console.error("Error fetching order details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [id]);

    if (loading) return <p>Chargement</p>  // Indicateur de chargement
    if (error) return <p className='error-message'>Error: {error}</p>  // Affichage des erreurs

    const {user, address, city, country, products, total_price, status} = orderDetails;  // Destructuration des données

    return (
        <div className="order-confirmation">
            <h1>Confirmation de commande</h1>
            <p>Votre commande avec ID <strong>{id}</strong>a été placé avec succès</p>  {/* Message de confirmation */}
            <h2>Détails de la commande</h2>
            <div className="order-summary">
                <h1>Confirmation de commande</h1>
                <p><strong>Nom:</strong> {user.username}</p>  {/* Nom de l'utilisateur */}
                <p><strong>Addresse:</strong> {address}</p>  {/* Adresse de livraison */}
                <p><strong>Ville:</strong> {city}</p>  {/* Ville de livraison */}
                <p><strong>Pays:</strong>{country}</p>  {/* Pays de livraison */}

                <h3>Produits</h3>
                <ul className="product-list">
                    {products.map((product) => (
                        <li key={product.id} className="product-item">
                            <img src={product.image} alt={product.name} className='product-image'/>  {/* Image du produit */}
                            <div className='product-details'>
                                <h4>{product.name}</h4>  {/* Nom du produit */}
                                <p><strong>Quantite:</strong>{product.quantity}</p>  {/* Quantité commandée */}
                                <p><strong>Prix:</strong>{product.price} XOF</p>  {/* Prix unitaire */}
                            </div>
                        </li>
                    ))}
                </ul>
                <h3>Prix ​​total</h3>
                <p>{total_price} XOF</p>  {/* Prix total de la commande */}
                <h3>Statut:</h3>
                <p>{status}</p>  {/* Statut de la commande */}
            </div>

            {/* Affichage des options de paiement si la commande n'est pas complétée */}
            {status !== "COMPLETED" && (
            <div className="payment-options">
                {clientSecret && (
                    // Intégration des éléments Stripe pour le paiement
                    <Elements stripe={stripePromise}>
                        <PaymentForm  orderId={id} orderDetails={orderDetails} clientSecret={clientSecret} />
                    </Elements>
                )}

                {/* Interface iPay retirée comme demandé */}
            </div>
            )}
            {/* Message de confirmation si la commande est déjà complétée */}
            {status === "COMPLETED" && 
                <p className='confirmation-message'>
                    Votre commande a été complétée avec succès. Merci pour votre commande.!
                </p>
            }
        </div>       
    );
}
export default OrderConfirmation;