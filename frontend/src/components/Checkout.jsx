import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import api from '../api';
import "../styles/Checkout.css";

const Checkout = () => {
    const {state: {cart}, clearCart} = useCart();
    const navigate = useNavigate();

    const [customerInfo, setCustomerInfo] = useState({
        address: '',
        city: '',
        country: '',
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCustomerInfo({...customerInfo, [name]: value });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!customerInfo.address || !customerInfo.city || !customerInfo.country) {
            console.error("All fields are required");
            return;
        }
        try {
            const response = await api.post('api/orders/new/', {
                address: customerInfo.address,
                city: customerInfo.city,
                country: customerInfo.country,
                products: cart.map(item => ({
                    ...item,
                    price: parseFloat(item.price),
                }))
            });
            console.log("Order Response", response.data);

            if (response.status === 201) {
                clearCart();
                navigate(`/order-confirmation/${response.data.id}`);
            }
        }catch (err) {
            console.error("Error creating order:", err);
        }
    }

    if (!cart || cart.length === 0) {
        return  <p>Votre panier est vide, veuillez ajouter des produits pour procéder au paiement..</p>
    }

    return (
        <div className="checkout-container">
            <h1>Vérifier</h1>
            <form onSubmit={handleSubmit} className="checkout-form">

                <input
                    type="text"
                    name="address"
                    value={customerInfo.address}
                    onChange={handleInputChange}
                    placeholder='Addresse'
                    className='checkout-input'
                    required
                />
                    
                <input
                    type="text"
                    name="city"
                    value={customerInfo.city}
                    onChange={handleInputChange}
                    placeholder='ville'
                    className='checkout-input'
                    required
                />
                 
                <input
                    type="text"
                    name="country"
                    value={customerInfo.country}
                    onChange={handleInputChange}
                    placeholder='Pays'
                    className='checkout-input'
                    required
                />

                <h3> Récapitulatif de la commande</h3>
                <ul className='order-summary'>
                    {cart.map((item) => (
                        <li key={item.id} className='order-item'>
                            {item.name} - {item.price} XOF x {item.quantity}
                        </li>
                    ))}
                </ul>
                <p className='total-price'> Total: 
                    {cart.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)} XOF
                </p>
                <button type="submit" className="checkout-buton">Passer la commande</button>
            </form>
        </div>
    );
};

export default Checkout;