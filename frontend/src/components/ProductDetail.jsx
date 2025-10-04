import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import '../styles/ProductDetail.css';
import { toast } from 'react-toastify';

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

    if (error) return <p>{error}</p>;
    if (!product) return <p>Chargement...</p>;

    return (
        <div className="product-detail">
            <button className="back-btn" onClick={() => navigate(-1)}>← Retour</button>
            <div className="detail-grid">
                <div className="detail-image">
                    <img src={product.image} alt={product.name} />
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
                        <button className="add-to-cart-button">Ajouter au panier</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
