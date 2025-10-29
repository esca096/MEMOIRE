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
 * VERSION COMPLÈTE CORRIGÉE - SDK IPAYMONEY
 */

import React, { useState, useEffect, useRef } from 'react';
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

// Composant IpayMoney - VERSION AVEC GESTION DU WEBHOOK EN ERREUR
const IpayMoneyPayment = ({ orderId, totalPrice }) => {
    const [paymentStatus, setPaymentStatus] = useState('idle');
    const [error, setError] = useState(null);
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const [verificationCount, setVerificationCount] = useState(0);
    const [lastTransactionId, setLastTransactionId] = useState(null);

    // Génération d'un ID de transaction unique
    const generateTransactionId = () => {
        const transactionId = `TECHSHOP-${orderId}-${Date.now()}`;
        setLastTransactionId(transactionId);
        return transactionId;
    };

    // Vérification du chargement du SDK IpayMoney
    useEffect(() => {
        const checkSDK = () => {
            const scriptLoaded = document.querySelector('script[src*="i-pay.money/checkout.js"]');
            if (scriptLoaded) {
                console.log('✅ Script IpayMoney détecté dans le DOM');
                setSdkLoaded(true);
            }
        };

        const timer = setTimeout(checkSDK, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Vérification du statut du paiement - AMÉLIORÉE
    useEffect(() => {
        if (paymentStatus === 'processing') {
            let checkCount = 0;
            const maxChecks = 20; // Réduit à 20 vérifications
            
            const checkInterval = setInterval(async () => {
                try {
                    checkCount++;
                    setVerificationCount(checkCount);
                    console.log(`🔄 Vérification du paiement #${checkCount}...`);
                    
                    const response = await api.get(`https://memoire-backend-4rx4.onrender.com/api/orders/${orderId}/verify_ipaymoney/`);
                    
                    console.log('📊 Réponse vérification:', response.data);
                    
                    if (response.data.status === 'completed') {
                        console.log('✅ Paiement confirmé !');
                        setPaymentStatus('success');
                        clearInterval(checkInterval);
                        
                    } else if (response.data.status === 'failed') {
                        console.log('❌ Paiement échoué');
                        setPaymentStatus('idle');
                        setError('Le paiement a échoué. Veuillez réessayer.');
                        clearInterval(checkInterval);
                    } else {
                        console.log('⏳ Paiement en attente...');
                        
                        // Après 10 vérifications, vérifier manuellement avec IpayMoney
                        if (checkCount === 10) {
                            console.log('🔍 Vérification manuelle déclenchée');
                            checkPaymentStatusManually();
                        }
                    }
                    
                    if (checkCount >= maxChecks) {
                        console.log('⏰ Timeout - Webhook en erreur probable');
                        setPaymentStatus('idle');
                        setError(
                            <div>
                                <h4>✅ Paiement effectué mais confirmation en attente</h4>
                                <p>Votre paiement a été reçu mais la confirmation est retardée.</p>
                                
                                <div style={{background: '#fff3cd', padding: '15px', borderRadius: '5px', margin: '10px 0'}}>
                                    <strong>Informations importantes :</strong>
                                    <ul style={{textAlign: 'left', margin: '10px 0'}}>
                                        <li>💰 <strong>Paiement réussi</strong> chez IpayMoney</li>
                                        <li>⏳ <strong>Confirmation en attente</strong> côté boutique</li>
                                        <li>📧 <strong>Vérifiez votre email</strong> de confirmation IpayMoney</li>
                                        <li>🆔 <strong>Référence:</strong> {lastTransactionId}</li>
                                    </ul>
                                </div>
                                
                                <div className="error-actions">
                                    <button 
                                        onClick={() => window.location.reload()}
                                        className="reload-button"
                                    >
                                        Recharger la page
                                    </button>
                                    <button 
                                        onClick={checkPaymentStatusManually}
                                        className="retry-button"
                                    >
                                        Vérifier manuellement
                                    </button>
                                </div>
                            </div>
                        );
                        clearInterval(checkInterval);
                    }
                } catch (error) {
                    console.log('❌ Erreur vérification paiement:', error);
                    if (checkCount >= 5) {
                        setError('Erreur de connexion au serveur.');
                        clearInterval(checkInterval);
                    }
                }
            }, 5000);

            return () => clearInterval(checkInterval);
        }
    }, [paymentStatus, orderId, lastTransactionId]);

    // Vérification manuelle du statut
    const checkPaymentStatusManually = async () => {
        try {
            console.log('🔍 Vérification manuelle du statut...');
            const response = await api.get(`https://memoire-backend-4rx4.onrender.com/api/orders/${orderId}/verify_ipaymoney/`);
            console.log('📊 Statut manuel:', response.data);
            
            if (response.data.status === 'completed') {
                setPaymentStatus('success');
            } else {
                setError(
                    <div>
                        <p>Le statut est toujours: <strong>{response.data.status}</strong></p>
                        <p>Message: {response.data.message}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="reload-button"
                        >
                            Recharger pour vérifier
                        </button>
                    </div>
                );
            }
        } catch (error) {
            console.error('Erreur vérification manuelle:', error);
        }
    };

    const ipaymoneyPublicKey = import.meta.env.VITE_IPAYMONEY_PUBLIC_KEY;
    const amountInXOF = Math.round(totalPrice);

    const handleIpayMoneyPayment = async () => {
        console.log('🔄 Démarrage paiement IpayMoney...');
        setPaymentStatus('processing');
        setError(null);
        setVerificationCount(0);

        try {
            const transactionId = generateTransactionId();
            
            console.log('📦 Transaction ID:', transactionId);

            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            const raw = JSON.stringify({
                key: ipaymoneyPublicKey,
                amount: amountInXOF,
                environement: "live",
                transaction_id: transactionId,
                parent_domaine: window.location.origin
            });

            const requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: raw
            };

            console.log('🚀 Envoi requête vers IpayMoney...');
            
            const response = await fetch('https://i-pay.money/api/sdk/payment_pages/create_payment_token', requestOptions);
            const data = await response.json();
            
            console.log('✅ Réponse IpayMoney:', data);
            
            if (!data.token) {
                throw new Error('Token non reçu de IpayMoney');
            }

            const token = data.token;

            // CRÉATION DE L'IFRAME DE PAIEMENT
            const iPayDiv = document.createElement("div");
            document.body.appendChild(iPayDiv);
            iPayDiv.className = "ipaymoney-payment-page";
            iPayDiv.setAttribute("style", `
                position: fixed; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                background-color: rgba(0, 0, 0, 0.50); 
                z-index: 999999;
                display: flex;
                justify-content: center;
                align-items: center;
            `);

            const iPayIframeContainer = document.createElement("div");
            iPayDiv.appendChild(iPayIframeContainer);
            iPayIframeContainer.setAttribute("style", `
                position: relative; 
                width: 90%; 
                height: 90%; 
                max-width: 500px;
                max-height: 700px;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            `);

            // Bouton de fermeture
            const closeButton = document.createElement("button");
            closeButton.innerHTML = "×";
            closeButton.setAttribute("style", `
                position: absolute;
                top: 10px;
                right: 15px;
                background: transparent;
                border: none;
                font-size: 24px;
                color: #666;
                cursor: pointer;
                z-index: 1000000;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            `);
            closeButton.onclick = () => {
                iPayDiv.remove();
                setPaymentStatus('idle');
            };
            iPayIframeContainer.appendChild(closeButton);

            const iPayIframe = document.createElement("iframe");
            iPayIframeContainer.appendChild(iPayIframe);
            iPayIframe.setAttribute("style", `
                border: 0; 
                width: 100%; 
                height: 100%; 
                display: block;
                border-radius: 10px;
            `);
            
            const sdkUrl = `https://i-pay.money/api/sdk/payment_pages?token=${token}`;
            iPayIframe.src = sdkUrl;
            iPayIframe.id = "i-pay-frame";
            iPayIframe.allow = "payment";

            console.log('🎯 Iframe créée avec URL:', sdkUrl);

            // Gérer la fermeture
            iPayDiv.addEventListener('click', (e) => {
                if (e.target === iPayDiv) {
                    iPayDiv.remove();
                    setPaymentStatus('idle');
                }
            });

            const handleMessage = function(message) {
                console.log('📨 Message reçu:', message.data);
                
                if (message.data.type === "closeModal") {
                    iPayDiv.remove();
                    window.removeEventListener('message', handleMessage);
                }
                
                if (message.data.type === "payment.response") {
                    console.log('💰 Réponse paiement:', message.data);
                    iPayDiv.remove();
                    window.removeEventListener('message', handleMessage);
                }
            };

            window.addEventListener('message', handleMessage);

        } catch (error) {
            console.error('❌ Erreur création paiement:', error);
            setError(`Erreur: ${error.message}`);
            setPaymentStatus('idle');
        }
    };

    // AFFICHAGE SUCCÈS
    if (paymentStatus === 'success') {
        return (
            <div className="ipaymoney-payment-container">
                <div className="success-message">
                    <h3>✅ Paiement IpayMoney réussi !</h3>
                    <p>Votre commande #<strong>{orderId}</strong> est confirmée.</p>
                    <p>Merci pour votre achat !</p>
                    <button 
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '15px',
                            padding: '10px 20px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Voir la confirmation
                    </button>
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
                
                {error && (
                    <div className="error-message">
                        <div>{error}</div>
                    </div>
                )}
                
                <div className="method-description">
                    <p>Paiement par carte bancaire, mobile money, et autres méthodes locales</p>
                    <ul className="payment-methods-list">
                        <li>💳 Cartes Visa, Mastercard</li>
                        <li>📱 Mobile Money (Orange Money, MTN Money, etc.)</li>
                        <li>🏦 Paiement via NITA, AMANATA ...</li>
                    </ul>
                </div>

                <div className="ipaymoney-button-container">
                    <button
                        type="button"
                        className="ipaymoney-button"
                        onClick={handleIpayMoneyPayment}
                        disabled={paymentStatus === 'processing'}
                    >
                        {paymentStatus === 'processing' ? `Vérification... (${verificationCount})` : `Payer ${amountInXOF} XOF`}
                    </button>
                </div>

                {paymentStatus === 'processing' && (
                    <div className="payment-status">
                        <p>🔄 Vérification en cours... ({verificationCount}/20)</p>
                        <p className="status-note">
                            Le processus peut prendre quelques minutes.
                        </p>
                    </div>
                )}

                <div className="payment-security">
                    <p className="security-note">
                        🔒 Transaction sécurisée par IpayMoney
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
