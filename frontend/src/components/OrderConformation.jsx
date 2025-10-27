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

/**
 * Fichier: frontend/src/components/OrderConfirmation.jsx
 * 
 * VERSION DÉBOGUÉE - Problèmes images résolus + meilleur logging
 */

/**
 * Fichier: frontend/src/components/OrderConfirmation.jsx
 * 
 * INTÉGRATION IPAYMONEY COMPLÈTE SANS DEBUG
 */
/**
 * Fichier: frontend/src/components/OrderConfirmation.jsx
 * 
 * INTÉGRATION IPAYMONEY COMPLÈTE - URLs CORRIGÉES
 */

/**
 * Fichier: frontend/src/components/OrderConfirmation.jsx
 * 
 * INTÉGRATION IPAYMONEY COMPLÈTE - ENVIRONNEMENT LIVE
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../api';
import "../styles/OrderConfirmation.css";

// Chargement de la clé publique Stripe
const STRIPE_PUB_KEY = import.meta.env.VITE_STRIPE_PUB_KEY;
const stripePromise = loadStripe(STRIPE_PUB_KEY);

// Composant SafeImage
const SafeImage = ({ src, alt, className }) => {
    const [imgSrc, setImgSrc] = useState(src);
    
    const handleError = () => {
        console.log(`Image non trouvée: ${src}`);
        setImgSrc('/default-product.png');
    };

    return (
        <img 
            src={imgSrc} 
            alt={alt} 
            className={className}
            onError={handleError}
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

// Composant IpayMoney - VERSION LIVE
const IpayMoneyPayment = ({ orderId, totalPrice }) => {
    const [paymentStatus, setPaymentStatus] = useState('idle');

    // Génération d'un ID de transaction unique
    const generateTransactionId = () => {
        return `TECHSHOP-${orderId}-${Date.now()}`;
    };

    // Vérification que le SDK est chargé
    useEffect(() => {
        const checkSDK = () => {
            if (typeof window.ipaymoney === 'undefined') {
                console.error('❌ SDK IpayMoney non chargé');
                // Recharger le script si nécessaire
                const script = document.createElement('script');
                script.src = 'https://i-pay.money/checkout.js';
                script.onload = () => console.log('✅ SDK IpayMoney chargé');
                document.head.appendChild(script);
            } else {
                console.log('✅ SDK IpayMoney prêt');
            }
        };

        checkSDK();
    }, []);

    // Vérification du statut du paiement
    useEffect(() => {
        if (paymentStatus === 'processing') {
            const checkInterval = setInterval(async () => {
                try {
                    const response = await api.get(`https://memoire-backend-4rx4.onrender.com/api/orders/${orderId}/verify_ipaymoney/`);
                    if (response.data.status === 'completed') {
                        setPaymentStatus('success');
                        clearInterval(checkInterval);
                    }
                } catch (error) {
                    console.log('Erreur vérification paiement:', error);
                }
            }, 5000);

            return () => clearInterval(checkInterval);
        }
    }, [paymentStatus, orderId]);

    // Clé publique LIVE - REMPLACEZ PAR VOTRE VRAIE CLÉ LIVE
    const ipaymoneyPublicKey = import.meta.env.VITE_IPAYMONEY_PUBLIC_KEY;

    if (paymentStatus === 'success') {
        return (
            <div className="ipaymoney-payment-container">
                <div className="success-message">
                    <h3>✅ Paiement IpayMoney réussi !</h3>
                    <p>Votre commande a été confirmée.</p>
                </div>
            </div>
        );
    }

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
                        <li>💳 Cartes Visa, Mastercard</li>
                        <li>📱 Mobile Money (Orange Money, MTN Money, etc.)</li>
                        <li>🏦 Virements bancaires</li>
                    </ul>
                </div>

                {/* BOUTON IPAYMONEY - ENVIRONNEMENT LIVE */}
                <div className="ipaymoney-button-container">
                    <button
                        type="button"
                        className="ipaymoney-button"
                        data-amount={Math.round(totalPrice * 100)}
                        data-environement="live"
                        data-key={ipaymoneyPublicKey}
                        data-transaction-id={generateTransactionId()}
                        data-redirect-url={`https://memoire-hazel.vercel.app/order-confirmation/`}
                        data-callback-url={`https://memoire-backend-4rx4.onrender.com/api/ipaymoney/callback/`}
                        onClick={() => {
                            console.log('🔄 Démarrage paiement IpayMoney LIVE...');
                            setPaymentStatus('processing');
                            
                            // Vérification finale
                            if (typeof window.ipaymoney === 'undefined') {
                                alert('SDK IpayMoney non chargé. Rechargez la page.');
                                return;
                            }
                        }}
                        disabled={paymentStatus === 'processing'}
                    >
                        {paymentStatus === 'processing' ? 'Redirection...' : `Payer ${totalPrice} XOF`}
                    </button>
                </div>

                {paymentStatus === 'processing' && (
                    <div className="payment-status">
                        <p>🔄 Redirection vers IpayMoney...</p>
                        <p className="status-note">
                            Si la redirection ne se fait pas automatiquement, vérifiez votre bloqueur de publicités.
                        </p>
                    </div>
                )}

                <div className="payment-security">
                    <p className="security-note">
                        🔒 Transaction sécurisée par IpayMoney - Environnement LIVE
                    </p>
                </div>
            </div>
        </div>
    );
};

// Composant principal OrderConfirmation
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
                        console.log('Stripe non disponible - IpayMoney sera utilisé');
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
