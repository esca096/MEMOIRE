import React, { useEffect, useState } from 'react';
import api from '../api';
import '../styles/Products.css';
import { Link } from 'react-router-dom';
import { useCart } from './CartContext';
import { toast } from 'react-toastify';

const PLACEHOLDER = 'https://via.placeholder.com/320x200?text=No+Image';

const Spinner = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 18, height: 18, border: '3px solid #ddd', borderTop: '3px solid #333', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <div>Chargement des recommandations...</div>
    </div>
);

const Recommendations = ({ productId }) => {
    const [recs, setRecs] = useState([]);
    const { addToCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const resolveImage = (img) => {
        if (!img) return PLACEHOLDER;
        if (img.startsWith('http://') || img.startsWith('https://')) return img;
        const base = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : 'http://127.0.0.1:8000';
        if (img.startsWith('/')) return `${base}${img}`;
        return `${base}/${img}`;
    };

    const truncate = (text, max = 80) => {
        if (!text) return '';
        return text.length > max ? text.slice(0, max).trim() + '...' : text;
    };

    useEffect(() => {
        if (!productId) return;
        const fetchRecs = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/api/products/${productId}/recommendations/`);
                setRecs(res.data || []);
            } catch (err) {
                console.error('Error fetching recommendations:', err);
                setError('Impossible de charger les recommandations.');
            } finally {
                setLoading(false);
            }
        };
        fetchRecs();
    }, [productId]);

    if (loading) return <Spinner />;
    if (error) return <div>{error}</div>;
    if (!recs || recs.length === 0) return null;

    return (
        <div className="recommendations">
            <h3>Produits recommandés</h3>
            <div className="product-grid">
                {recs.map(p => (
                    <Link key={p.id} to={`/product/${p.id}`} state={{ product: p }} className="product-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="product-image">
                            <img
                                src={resolveImage(p.image)}
                                alt={p.name}
                                onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER; }}
                            />
                        </div>
                        <h4>{p.name}</h4>
                        <p className="rec-desc">{truncate(p.description, 80)}</p>
                        <div className="product-meta">
                            <span className="badge">Notation: {p.average_rating ? Number(p.average_rating).toFixed(1) : '—'}</span>
                            <span>Avis: {p.review_count || 0}</span>
                        </div>
                        <p><strong>Prix:</strong> {p.price} XOF</p>
                        <button onClick={(e) => { e.preventDefault(); addToCart({ id: p.id, name: p.name, price: p.price, image: p.image, quantity: 1 }); toast.success(`${p.name} ajouté au panier`); }} className="add-to-cart-button">Ajouter au panier</button>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Recommendations;
