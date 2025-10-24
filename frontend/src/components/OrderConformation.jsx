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

/**
 * Fichier: frontend/src/components/OrderConfirmation.jsx
 * 
 * INTÉGRATION SIMPLE IPAYMONEY - Bouton direct selon documentation
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../api';
import "../styles/OrderConfirmation.css";

// Chargement de la clé publique Stripe
const STRIPE_PUB_KEY = import.meta.env.VITE_STRIPE_PUB_KEY
const stripePromise = loadStripe(STRIPE_PUB_KEY)

// Composant SafeImage pour gérer les images manquantes
const SafeImage = ({ src, alt, className, fallback = '/images/default-product.png' }) => {
    const [imgSrc, setImgSrc] = useState(src);
    return (
        <img 
            src={imgSrc} 
            alt={alt} 
            className={className}
            onError={() => setImgSrc(fallback)}
        />
    );
};

// Composant de formulaire de paiement Stripe
const PaymentForm = ({clientSecret, orderId, orderDetails}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

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
                await api.post(`api/orders/${orderId}/mark_paid/`,{ payment_id: paymentId });
                setPaymentSuccess(true);
            }
            setLoading(false);
        }
    };

    return (
        <div className="payment-form">
            {paymentSuccess ? (
                <h3 className='success-message'>Paiement réussi! Votre commande est confirmée.</h3>
            ) : (
                <form onSubmit={handleSubmit} className='payment-form__form'>
                    <div className="stripe-element-container">
                        <CardElement 
                            options={{
                                style: {
                                    base: {
                                        fontSize: '16px',
                                        color: '#32325d',
                                        fontFamily: 'Arial, sans-serif',
                                        '::placeholder': { color: '#aab7c4' },
                                    },
                                    invalid: {
                                        color: '#fa755a',
                                        iconColor: '#fa755a',
                                    },
                                },
                            }}  
                        />
                    </div>
                    <button type="submit" disabled={!stripe || loading} className="submit-button">
                        {loading ? 'Traitement...' : 'Payer avec Stripe'}
                    </button>
                    {error && <p className='error-message'>{error}</p>}
                </form>
            )}
        </div>
    );
};

// NOUVEAU : Composant IpayMoney simple avec bouton direct
const IpayMoneyPayment = ({ orderId, totalPrice }) => {
    const generateTransactionId = () => {
        return `TECHSHOP-${orderId}-${Date.now()}`;
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
                </div>

                {/* BOUTON IPAYMONEY DIRECT SELON DOCUMENTATION */}
                <button
                    type="button"
                    className="ipaymoney-button"
                    data-amount={Math.round(totalPrice * 100)} // Montant en centimes
                    data-environement="live"
                    data-key="pk_639a33d2e4b341c4a8a281a805779c11" // ⚠️ REMPLACEZ PAR VOTRE CLÉ RÉELLE
                    data-transaction-id={generateTransactionId()}
                    data-redirect-url={`${window.location.origin}/payment/success/?order_id=${orderId}`}
                    data-callback-url={`${window.location.origin}/api/ipaymoney/callback/`}
                >
                    Payer avec IpayMoney
                </button>

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
    const [paymentMethod, setPaymentMethod] = useState(null);

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
                        console.warn('Stripe non disponible');
                    }
                }
            } catch (error) {
                setError("Erreur lors du chargement des détails de la commande");
                console.error("Error fetching order details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [id]);

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
                                <SafeImage 
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

            {/* SECTION PAIEMENT */}
            {status !== "COMPLETED" && (
                <div className="payment-section">
                    <div className="payment-header">
                        <h2>Finaliser votre paiement</h2>
                        <p>Choisissez votre méthode de paiement préférée</p>
                    </div>

                    {!paymentMethod ? (
                        <div className="payment-methods-selection">
                            <div className="methods-grid">
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

                            {paymentMethod === 'stripe' && clientSecret && (
                                <Elements stripe={stripePromise}>
                                    <PaymentForm 
                                        orderId={id} 
                                        orderDetails={orderDetails} 
                                        clientSecret={clientSecret} 
                                    />
                                </Elements>
                            )}

                            {paymentMethod === 'ipaymoney' && (
                                <IpayMoneyPayment
                                    orderId={id}
                                    totalPrice={parseFloat(total_price)}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}

            {status === "COMPLETED" && (
                <div className="payment-completed">
                    <div className="success-message">
                        <h3>✅ Paiement confirmé !</h3>
                        <p>Votre commande a été payée avec succès. Merci pour votre achat !</p>
                    </div>
                </div>
            )}
        </div>       
    );
}

export default OrderConfirmation;
