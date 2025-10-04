import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../api';
import "../styles/OrderConfirmation.css";

// load the stripe pub key
const STRIPE_PUB_KEY = import.meta.env.VITE_STRIPE_PUB_KEY
console.log(STRIPE_PUB_KEY)
const stripePromise = loadStripe(STRIPE_PUB_KEY)

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
                    name: orderDetails?.user.username || 'Custmer Paying'
                },
            },
        })

        if (result.error) {
            setError(result.error.message);
            setLoading(false);
        } else {
            if (result.paymentIntent.status === 'succeeded') {
                const paymentId = result.paymentIntent.id; //extract the payment id

                // mark the order as paid with the payment id
                await api.post(`api/orders/${orderId}/mark_paid/`,{
                    payment_id: paymentId, // send the payment id to the backend
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
            }, 3000); // Redirect after 3 seconds to the review page
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
                        {loading ? 'Processing...' : 'Pay Now'}
                        {error && <p className='error-message'>{error}</p>}
                    </button>
                </form>
            )}
        </div>
    );
};


const OrderConfirmation = () => {
    const {id} = useParams();
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    // iPay integration removed from UI for now

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await api.get(`api/orders/${id}/`);
                setOrderDetails(response.data);
                if (response.data.status !== 'COMPLETED') {
                    // prepare stripe clientSecret as before
                    try {
                        const paymentResponse = await api.post(`api/orders/${id}/create_payment_intent`);
                        setClientSecret(paymentResponse.data.clientSecret);
                    } catch (err) {
                        // ignore if stripe not configured or failed
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

    if (loading) return <p>Chargement</p>
    if (error) return <p className='error-message'>Error: {error}</p>

    const {user, address, city, country, products, total_price, status} = orderDetails;

    return (
        <div className="order-confirmation">
            <h1>Confirmation de commande</h1>
            <p>Votre commande avec ID <strong>{id}</strong>a été placé avec succès</p>
            <h2>Détails de la commande</h2>
            <div className="order-summary">
                <h1>Confirmation de commande</h1>
                <p><strong>Nom:</strong> {user.username}</p>
                <p><strong>Addresse:</strong> {address}</p>
                <p><strong>Ville:</strong> {city}</p>
                <p><strong>Pays:</strong>{country}</p>

                <h3>Produits</h3>
                <ul className="product-list">
                    {products.map((product) => (
                        <li key={product.id} className="product-item">
                            <img src={product.image} alt={product.name} className='product-image'/>
                            <div className='product-details'>
                                <h4>{product.name}</h4>
                                <p><strong>Quantite:</strong>{product.quantity}</p>
                                <p><strong>Prix:</strong>{product.price} XOF</p>
                            </div>
                        </li>
                    ))}
                </ul>
                <h3>Prix ​​total</h3>
                <p>{total_price} XOF</p>
                <h3>Statut:</h3>
                <p>{status}</p>
            </div>

            {status !== "COMPLETED" && (
            <div className="payment-options">
                {clientSecret && (
                    <Elements stripe={stripePromise}>
                        <PaymentForm  orderId={id} orderDetails={orderDetails} clientSecret={clientSecret} />
                    </Elements>
                )}

                {/* iPay UI removed per request */}
            </div>
            )}
            {status === "COMPLETED" && 
                <p className='confirmation-message'>
                    Votre commande a été complétée avec succès. Merci pour votre commande.!
                </p>
            }
        </div>       
    );
}
export default OrderConfirmation;