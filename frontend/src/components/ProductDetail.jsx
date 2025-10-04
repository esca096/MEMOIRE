import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import '../styles/ProductDetail.css';
import { toast } from 'react-toastify';
import { useCart } from './CartContext';
import Recommendations from './Recommendations';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [error, setError] = useState(null);
    const location = useLocation();

    useEffect(() => {
        // If navigation provided product in state, use it (faster, avoids extra request)
        if (location && location.state && location.state.product) {
            setProduct(location.state.product);
            return;
        }

        const fetchProduct = async () => {
            try {
                const res = await api.get(`/api/products/${id}`);
                setProduct(res.data);
            } catch (err) {
                console.error('Error fetching product:', err);
                setError('Impossible de charger le produit.');
                toast.error('Failed to load product.');
            }
        };
        fetchProduct();
    }, [id, location]);

    const { addToCart } = useCart();

    if (error) return <p>{error}</p>;
    if (!product) return <p>Chargement...</p>;

    return (
        <div className="product-detail">
            <button className="back-btn" onClick={() => navigate(-1)}>← Retour</button>
            <div className="detail-grid">
                    <div className="detail-image">
                    <img src={product.image || 'https://via.placeholder.com/640x400?text=No+Image'} alt={product.name} onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/640x400?text=No+Image'; }} />
                </div>
                <div className="detail-info">
                    <h1>{product.name}</h1>
                    <p className="detail-price">{product.price} XOF</p>
                    <p className="detail-desc">{product.description}</p>
                    <div className="detail-meta">
                        <span>Quantité: {product.quantity}</span>
                        <span>Avis: {product.review_count || 0}</span>
                    </div>
                    <div className="detail-actions">
                        <button className="add-to-cart-button" onClick={() => {
                            addToCart({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
                            toast.success(`${product.name} ajouté au panier`);
                        }}>Ajouter au panier</button>
                    </div>
                </div>
            </div>
            <Recommendations productId={product.id} />
        </div>
    );
};

export default ProductDetail;
