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
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../api';
import "../styles/OrderConfirmation.css";

import IpayMoneyButton from './IpayMoneyButton';

// Chargement de la clé publique Stripe
const STRIPE_PUB_KEY = import.meta.env.VITE_STRIPE_PUB_KEY
const stripePromise = loadStripe(STRIPE_PUB_KEY)

// Composant de formulaire de paiement Stripe (EXISTANT - inchangé)
const PaymentForm = ({clientSecret, orderId, orderDetails}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!stripe || !elements) return;

        const card = elements.getElement(CardElement);

        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: card,
                billing_details: {
                    name: orderDetails?.user.username || 'Customer Paying'
                },
            },
        })

        if (result.error) {
            setError(result.error.message);
            setLoading(false);
        } else {
            if (result.paymentIntent.status === 'succeeded') {
                const paymentId = result.paymentIntent.id;

                await api.post(`api/orders/${orderId}/mark_paid/`,{
                    payment_id: paymentId,
                })

                setPaymentSuccess(true);
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        if (paymentSuccess) {
            setTimeout(() => {
                navigate(`/reviews/${orderId}`);
            }, 3000);
        }
    }, [paymentSuccess, navigate, orderId]);

    return (
        <div className="payment-form">
            {paymentSuccess ? (
                <h3 className='success-message'>Paiement réussi! Votre commande est confirmée.</h3>
            ) : (
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
                        {loading ? 'Processing...' : 'Pay with Stripe'}
                        {error && <p className='error-message'>{error}</p>}
                    </button>
                </form>
            )}
        </div>
    );
};

// NOUVEAU : Composant IpayMoney isolé
const IpayMoneyPayment = ({ orderId, orderDetails, onPaymentSuccess, onPaymentError }) => {
    const [ipaymoneyLoading, setIpaymoneyLoading] = useState(false);
    const [ipaymoneyError, setIpaymoneyError] = useState(null);

    const handleIpaymoneySuccess = () => {
        console.log('✅ Paiement IpayMoney réussi');
        onPaymentSuccess?.();
    };

    const handleIpaymoneyError = (error) => {
        console.error('❌ Erreur IpayMoney:', error);
        setIpaymoneyError(error);
        onPaymentError?.(error);
    };

    return (
        <div className="ipaymoney-payment-container">
            <div className="payment-method-card ipaymoney-card">
                <div className="method-header">
                    <h3>🌍 Payer avec IpayMoney</h3>
                    <span className="secure-badge">Sécurisé</span>
                </div>
                
                <div className="method-description">
                    <p>Paiement par carte bancaire, mobile money, et autres méthodes locales</p>
                    <ul className="payment-methods-list">
                        <li>✅ Carte Visa/Mastercard</li>
                        <li>✅ Mobile Money</li>
                        <li>✅ Virements locaux</li>
                    </ul>
                </div>

                {ipaymoneyError && (
                    <div className="error-message ipaymoney-error">
                        {ipaymoneyError}
                    </div>
                )}

                <IpayMoneyButton 
                    orderId={orderId}
                    amount={parseFloat(orderDetails.total_price)}
                    onSuccess={handleIpaymoneySuccess}
                    onError={handleIpaymoneyError}
                />

                <div className="payment-security">
                    <p className="security-note">
                        🔒 Transaction 100% sécurisée par IpayMoney
                    </p>
                </div>
            </div>
        </div>
    );
};

// Composant principal de confirmation de commande
const OrderConfirmation = () => {
    const {id} = useParams();
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [paymentMethod, setPaymentMethod] = useState(null); // 'stripe' ou 'ipaymoney'

    // Récupération des détails de la commande
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await api.get(`api/orders/${id}/`);
                setOrderDetails(response.data);
                if (response.data.status !== 'COMPLETED') {
                    try {
                        const paymentResponse = await api.post(`api/orders/${id}/create_payment_intent`);
                        setClientSecret(paymentResponse.data.clientSecret);
                    } catch (err) {
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

    // Recharger les détails après paiement réussi
    const handlePaymentSuccess = async () => {
        try {
            const response = await api.get(`api/orders/${id}/`);
            setOrderDetails(response.data);
            setPaymentMethod(null); // Réinitialiser la sélection
        } catch (error) {
            console.error('Error refreshing order details:', error);
        }
    };

    const handlePaymentError = (errorMsg) => {
        setError(errorMsg);
        setPaymentMethod(null); // Réinitialiser en cas d'erreur
    };

    if (loading) return (
        <div className="order-confirmation">
            <div className="loading-container">
                <p>Chargement de votre commande...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="order-confirmation">
            <div className="error-container">
                <p className='error-message'>Erreur: {error}</p>
            </div>
        </div>
    );

    const {user, address, city, country, products, total_price, status} = orderDetails;

    return (
        <div className="order-confirmation">
            <div className="confirmation-header">
                <h1>Confirmation de commande</h1>
                <p>Votre commande <strong>#{id}</strong> a été créée avec succès</p>
            </div>

            {/* Détails de la commande */}
            <div className="order-summary">
                <h2>Détails de la commande</h2>
                
                <div className="customer-info">
                    <h3>Informations client</h3>
                    <p><strong>Nom:</strong> {user.username}</p>
                    <p><strong>Adresse:</strong> {address}</p>
                    <p><strong>Ville:</strong> {city}</p>
                    <p><strong>Pays:</strong> {country}</p>
                </div>

                <div className="products-section">
                    <h3>Produits commandés</h3>
                    <ul className="product-list">
                        {products.map((product, index) => (
                            <li key={index} className="product-item">
                                <img 
                                    src={product.image} 
                                    alt={product.name} 
                                    className='product-image'
                                />
                                <div className='product-details'>
                                    <h4>{product.name}</h4>
                                    <p><strong>Quantité:</strong> {product.quantity}</p>
                                    <p><strong>Prix unitaire:</strong> {product.price} XOF</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="order-total">
                    <h3>Total de la commande</h3>
                    <p className="total-price">{total_price} XOF</p>
                </div>

                <div className="order-status">
                    <h3>Statut</h3>
                    <p className={`status-badge ${status.toLowerCase()}`}>
                        {status === 'COMPLETED' ? '✅ Payée' : '⏳ En attente de paiement'}
                    </p>
                </div>
            </div>

            {/* SECTION PAIEMENT - CHOIX ENTRE STRIPE ET IPAYMONEY */}
            {status !== "COMPLETED" && (
                <div className="payment-section">
                    <div className="payment-header">
                        <h2>Finaliser votre paiement</h2>
                        <p>Choisissez votre méthode de paiement préférée</p>
                    </div>

                    {!paymentMethod ? (
                        // Étape 1 : Choix de la méthode de paiement
                        <div className="payment-methods-selection">
                            <div className="methods-grid">
                                {/* Option Stripe */}
                                <div 
                                    className="payment-option-card"
                                    onClick={() => setPaymentMethod('stripe')}
                                >
                                    <div className="option-icon">💳</div>
                                    <h4>Payer par Carte Bancaire</h4>
                                    <p>Carte Visa, Mastercard, etc.</p>
                                    <div className="option-features">
                                        <span>International</span>
                                        <span>Stripe</span>
                                    </div>
                                    <button className="select-method-btn">
                                        Choisir cette option
                                    </button>
                                </div>

                                {/* Option IpayMoney */}
                                <div 
                                    className="payment-option-card"
                                    onClick={() => setPaymentMethod('ipaymoney')}
                                >
                                    <div className="option-icon">🌍</div>
                                    <h4>Payer avec IpayMoney</h4>
                                    <p>Carte, Mobile Money, Virements</p>
                                    <div className="option-features">
                                        <span>Local</span>
                                        <span>Multi-méthodes</span>
                                    </div>
                                    <button className="select-method-btn">
                                        Choisir cette option
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Étape 2 : Formulaire de paiement selon la méthode choisie
                        <div className="selected-payment-method">
                            <div className="method-header-with-back">
                                <button 
                                    className="back-button"
                                    onClick={() => setPaymentMethod(null)}
                                >
                                    ← Retour au choix
                                </button>
                                <h3>
                                    {paymentMethod === 'stripe' ? 'Paiement par Carte' : 'Paiement IpayMoney'}
                                </h3>
                            </div>

                            {/* Stripe Payment */}
                            {paymentMethod === 'stripe' && clientSecret && (
                                <Elements stripe={stripePromise}>
                                    <PaymentForm 
                                        orderId={id} 
                                        orderDetails={orderDetails} 
                                        clientSecret={clientSecret} 
                                    />
                                </Elements>
                            )}

                            {/* IpayMoney Payment */}
                            {paymentMethod === 'ipaymoney' && (
                                <IpayMoneyPayment
                                    orderId={id}
                                    orderDetails={orderDetails}
                                    onPaymentSuccess={handlePaymentSuccess}
                                    onPaymentError={handlePaymentError}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Message de confirmation si déjà payé */}
            {status === "COMPLETED" && (
                <div className="payment-completed">
                    <div className="success-message">
                        <h3>✅ Paiement confirmé !</h3>
                        <p>Votre commande a été payée avec succès. Merci pour votre achat !</p>
                        <p>Vous recevrez un email de confirmation sous peu.</p>
                    </div>
                </div>
            )}
        </div>       
    );
}

export default OrderConfirmation;
