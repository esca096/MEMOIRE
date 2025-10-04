import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { fetchCart, updateCart } from './CartActions';


const CartContext = createContext();

const cartReducer = (state, action) => {
    switch (action.type) {
        case "SET_CART":
            return {...state, cart: action.payload };
        case "ADD_TO_CART":
            const existingProductIndex = state.cart.findIndex(item => item.id === action.payload.id);
            if (existingProductIndex >= 0) {
                const newCart = [...state.cart];
                newCart[existingProductIndex].quantity += action.payload.quantity;
                return {...state, cart: newCart };
            }else {
                return {...state, cart: [...state.cart, action.payload] };
            }
        case "REMOVE_FROM_CART":
            return {
                ...state,
                cart: state.cart.filter(item => item.id !== action.payload.id)
            };
        case "REMOVE_QUANTITY":
            const itemIndex = state.cart.findIndex(item => item.id === action.payload.id);
            if (itemIndex >= 0) {
                const newCart = [...state.cart];
                if (newCart[itemIndex].quantity > 1) {
                    newCart[itemIndex].quantity -= 1;
                    return {...state, cart: newCart };
                }else {
                    // to handle if th quantity is 1, remove the item from the cart
                    return {
                        ...state, 
                        cart: state.cart.filter(item => item.id !== action.payload.id) };
                }
            }
            return state; // if item not found, return current state
        case "INCREASE_QUANTITY":
            const increaseItemIndex = state.cart.findIndex(item => item.id === action.payload.id);
            if (increaseItemIndex >= 0) {
                const newCart = [...state.cart];
                newCart[increaseItemIndex].quantity += 1;
                return {...state, cart: newCart };
            }
            return state; // if item not found, return current state
        case "CLEAR_CART":
            return {...state, cart: [] };
        default:
            return state;
    };
};

export const CartProvider = ({ children }) => {
    const [state, dispatch] = useReducer(cartReducer, { cart: [] });

    useEffect(() => {
        const getCart = async () => {
            const itmes = await fetchCart();
            dispatch({ type: "SET_CART", payload: itmes });
        };
        getCart();
    }, []);

    const addToCart = async (item) => {
        // compute new cart deterministically so we can immediately sync to server
        const existingProductIndex = state.cart.findIndex(i => i.id === item.id);
        let newCart;
        const quantityToAdd = item.quantity || 1;
        if (existingProductIndex >= 0) {
            newCart = [...state.cart];
            newCart[existingProductIndex] = { ...newCart[existingProductIndex], quantity: (newCart[existingProductIndex].quantity || 0) + quantityToAdd };
        } else {
            newCart = [...state.cart, { ...item, quantity: quantityToAdd }];
        }
        dispatch({ type: "SET_CART", payload: newCart });
        try {
            await updateCart(newCart);
        } catch (e) {
            console.error('Failed to sync cart after add:', e);
        }
    };

    const removeFromCart = async (id) => {
        const newCart = state.cart.filter(item => item.id !== id);
        dispatch({ type: "SET_CART", payload: newCart });
        try {
            await updateCart(newCart);
        } catch (e) {
            console.error('Failed to sync cart after remove:', e);
        }
    };

    const removeFromQuantityCart = async (id) => {
        const itemIndex = state.cart.findIndex(item => item.id === id);
        if (itemIndex < 0) return;
        const newCart = [...state.cart];
        if ((newCart[itemIndex].quantity || 0) > 1) {
            newCart[itemIndex] = { ...newCart[itemIndex], quantity: newCart[itemIndex].quantity - 1 };
        } else {
            newCart.splice(itemIndex, 1);
        }
        dispatch({ type: "SET_CART", payload: newCart });
        try {
            await updateCart(newCart);
        } catch (e) {
            console.error('Failed to sync cart after decrease quantity:', e);
        }
    };

    const increaseQuantityCart = async (id) => {
        const itemIndex = state.cart.findIndex(item => item.id === id);
        if (itemIndex < 0) return;
        const newCart = [...state.cart];
        newCart[itemIndex] = { ...newCart[itemIndex], quantity: (newCart[itemIndex].quantity || 0) + 1 };
        dispatch({ type: "SET_CART", payload: newCart });
        try {
            await updateCart(newCart);
        } catch (e) {
            console.error('Failed to sync cart after increase quantity:', e);
        }
    };

    const clearCart = async () => {
        dispatch({ type: "SET_CART", payload: [] });
        try {
            await updateCart([]);
        } catch (e) {
            console.error('Failed to sync cart after clear:', e);
        }
    };
    // Provide the cart state and actions to the context
    return (
        <CartContext.Provider value={{ state, addToCart, removeFromCart, removeFromQuantityCart, increaseQuantityCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    return useContext(CartContext);
};