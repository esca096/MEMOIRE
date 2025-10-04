import React from 'react';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Cart.css';

const Cart = () => {
    const {state: {cart}, removeFromCart, removeFromQuantityCart, increaseQuantityCart, clearCart} = useCart();
    const navigate = useNavigate();

    const handleRemove = (id) => {
        removeFromCart(id);
    };

    const handleDecreaseQuantity = (id) => {
        removeFromQuantityCart(id);
    };

    const handleIncreaseQuantity = (id) => {
        increaseQuantityCart(id);
    };

    const handleClearCart = () => {
        clearCart();
    };

    const handleCheckout = () => {
        // Redirect to the checkout page
        navigate('/checkout');
    }

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
                            src={item.image} 
                            alt={item.name}
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
                        />
                        <div className='cart-item-info'>
                            <h2>{item.name}</h2>
                            <p><strong>Prix:</strong> {item.price} XOF</p>
                            <p><strong>Quantite:</strong> {item.quantity}</p>
                            <button onClick={() => handleIncreaseQuantity(item.id)} className='increase-btn'>
                                Augmenter
                            </button>
                            <button onClick={() => handleDecreaseQuantity(item.id)} className='decrease-btn'>
                                Diminuer
                            </button>
                            <button onClick={() => handleRemove(item.id)} className='remove-btn'>
                                Retirer
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className='cart-actions'>
                <button onClick={handleClearCart} className='clear-cart-btn'>Vider le panier</button>
                <p><strong>Total:</strong>XOF{cart.reduce((total, item) => total + item.price * item.quantity, 0)}</p>
                <button onClick={handleCheckout} className='checkout-btn'>Passer à la caisse</button>
            </div>
        </div>
    );
};
export default Cart;