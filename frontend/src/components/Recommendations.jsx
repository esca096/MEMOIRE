/**
 * Fichier: frontend/src/components/Recommendations.jsx
 *
 * Description (FR):
 * - Composant affichant une liste de produits recommandés pour un produit donné.
 * - Récupère les recommandations via l'API (endpoint `/api/products/:id/recommendations/`)
 *   puis affiche des cartes produit avec bouton "Ajouter au panier".
 * - Résout les URLs d'images relatives en URLs absolues via `VITE_API_URL`.
 * - Si l'utilisateur n'est pas connecté, le clic sur "Ajouter au panier" le
 *   redirige vers `/login` (logique d'authentification fournie par `useAuthentication`).
 *
 * Interactions principales :
 * - Appelle `api` (axios wrapper) pour récupérer les recommandations.
 * - Utilise `useCart()` pour ajouter des éléments au panier (qui synchronise
 *   avec le backend via `api/cart/`).
 */

import React, { useEffect, useState } from 'react';
import api from '../api';  // Client API Axios
import '../styles/Products.css';  // Styles CSS partagés avec les produits
import { Link, useNavigate } from 'react-router-dom';  // Navigation et liens
import { useAuthentication } from '../auth';  // Hook d'authentification
import { useCart } from './CartContext';  // Contexte du panier
import { toast } from 'react-toastify';  // Système de notifications

const PLACEHOLDER = 'https://via.placeholder.com/320x200?text=No+Image';  // Image de remplacement

// Composant spinner pour l'indicateur de chargement
const Spinner = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 18, height: 18, border: '3px solid #ddd', borderTop: '3px solid #333', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <div>Chargement des recommandations...</div>  {/* Texte de chargement */}
    </div>
);

const Recommendations = ({ productId }) => {
    const [recs, setRecs] = useState([]);  // Liste des recommandations
    const { addToCart } = useCart();  // Fonction d'ajout au panier
    const navigate = useNavigate();  // Hook pour la navigation
    const { isAuthorized } = useAuthentication();  // Statut d'authentification
    const [loading, setLoading] = useState(false);  // État de chargement
    const [error, setError] = useState(null);  // Gestion des erreurs

    // Résolution des URLs d'images relatives en URLs absolues
    const resolveImage = (img) => {
        if (!img) return PLACEHOLDER;
        if (img.startsWith('http://') || img.startsWith('https://')) return img;  // URL absolue déjà
        const base = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : 'http://127.0.0.1:8000';
        if (img.startsWith('/')) return `${base}${img}`;  // Chemin absolu avec base
        return `${base}/${img}`;  // Chemin relatif avec base
    };

    // Troncature du texte pour les descriptions
    const truncate = (text, max = 80) => {
        if (!text) return '';
        return text.length > max ? text.slice(0, max).trim() + '...' : text;
    };

    // Effet pour charger les recommandations quand le productId change
    useEffect(() => {
        if (!productId) return;
        const fetchRecs = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/api/products/${productId}/recommendations/`);
                // Parsing défensif : le backend peut retourner soit un tableau soit un objet avec une clé "recommendations"
                const data = res.data;
                let items = [];
                if (Array.isArray(data)) {
                    items = data;
                } else if (data && Array.isArray(data.recommendations)) {
                    items = data.recommendations;
                } else if (data && Array.isArray(data.results)) {
                    items = data.results;
                } else if (data && Array.isArray(data.data)) {
                    items = data.data;
                } else {
                    // tentative de découvrir une propriété tableau
                    const maybeArray = Object.values(data || {}).find(v => Array.isArray(v));
                    if (Array.isArray(maybeArray)) items = maybeArray;
                }

                if (!Array.isArray(items)) {
                    console.warn('Recommendations: unexpected response shape', data);
                    items = [];
                }

                setRecs(items);
            } catch (err) {
                console.error('Error fetching recommendations:', err);
                setError('Impossible de charger les recommandations.');
            } finally {
                setLoading(false);
            }
        };
        fetchRecs();
    }, [productId]);

    // États de chargement et d'erreur
    if (loading) return <Spinner />;
    if (error) return <div>{error}</div>;
    if (!recs || recs.length === 0) return null;  // Rien à afficher si pas de recommandations

    return (
        <div className="recommendations">
            <h3>Produits recommandés</h3>  {/* Titre de la section */}
            <div className="product-grid">
                {recs.map(p => (
                    <Link key={p.id} to={`/product/${p.id}`} state={{ product: p }} className="product-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                        {/* Image du produit recommandé */}
                        <div className="product-image">
                            <img
                                src={resolveImage(p.image)}
                                alt={p.name}
                                onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER; }}  // Fallback image
                            />
                        </div>
                        <h4>{p.name}</h4>  {/* Nom du produit */}
                        <p className="rec-desc">{truncate(p.description, 80)}</p>  {/* Description tronquée */}
                        <div className="product-meta">
                            <span className="badge">Notation: {p.average_rating ? Number(p.average_rating).toFixed(1) : '—'}</span>  {/* Note moyenne formatée */}
                            <span>Avis: {p.review_count || 0}</span>  {/* Nombre d'avis */}
                        </div>
                        <p><strong>Prix:</strong> {p.price} XOF</p>  {/* Prix du produit */}
                        {/* Bouton d'ajout au panier avec gestion d'authentification */}
                        <button onClick={(e) => {
                            e.preventDefault();  // Empêche la navigation du lien
                            if (!isAuthorized) {
                                navigate('/login');  // Redirection vers login si non connecté
                                return;
                            }
                            addToCart({ id: p.id, name: p.name, price: p.price, image: p.image, quantity: 1 });
                            toast.success(`${p.name} ajouté au panier`);  // Notification de succès
                        }} className="add-to-cart-button">Ajouter au panier</button>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Recommendations;