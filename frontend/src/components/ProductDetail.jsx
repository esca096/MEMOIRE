/**
 * Fichier: frontend/src/components/ProductDetail.jsx
 *
 * Description (FR):
 * - Affiche la page detail d'un produit.
 * - Si le produit est passé via `location.state` (depuis une liste), il l'utilise
 *   directement pour éviter une requête supplémentaire. Sinon, il appelle
 *   l'API pour charger le produit (`/api/products/:id`).
 * - Permet l'ajout au panier via `useCart()` et affiche les recommandations
 *   (composant `Recommendations`) basées sur ce produit.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';  // Hooks React Router
import { useAuthentication } from '../auth';
import api from '../api';  // Client API Axios
import '../styles/ProductDetail.css';  // Styles CSS du détail produit
import { toast } from 'react-toastify';  // Système de notifications
import { useCart } from './CartContext';  // Contexte du panier
import Recommendations from './Recommendations';  // Composant de recommandations

const ProductDetail = () => {
    const { id } = useParams();  // Récupération de l'ID produit depuis l'URL
    const navigate = useNavigate();  // Hook pour la navigation
    const [product, setProduct] = useState(null);  // État du produit
    const [error, setError] = useState(null);  // Gestion des erreurs
    const location = useLocation();  // Hook pour accéder à l'état de navigation

    // Effet pour charger le produit
    useEffect(() => {
        // Si la navigation a fourni le produit dans l'état, l'utiliser directement (plus rapide, évite une requête supplémentaire)
        if (location && location.state && location.state.product) {
            setProduct(location.state.product);
            return;
        }

        // Sinon, charger le produit depuis l'API
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/api/products/${id}`);
                setProduct(res.data);
            } catch (err) {
                console.error('Error fetching product:', err);
                setError('Impossible de charger le produit.');
                toast.error('Failed to load product.');  // Notification d'erreur
            }
        };
        fetchProduct();
    }, [id, location]);  // Dépendances : ID produit et location

    const { addToCart } = useCart();  // Fonction d'ajout au panier depuis le contexte
    const { isAuthorized } = useAuthentication();

    // Si l'utilisateur revient de la page de login avec ?add=1 et qu'il est connecté,
    // on ajoute automatiquement le produit au panier et on retire le paramètre.
    useEffect(() => {
        if (!product) return;
        const params = new URLSearchParams(location.search);
        const shouldAdd = params.get('add') === '1';
        if (shouldAdd && isAuthorized) {
            addToCart({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
            toast.success(`${product.name} ajouté au panier`);
            // Retirer le paramètre `add` sans recharger la page
            params.delete('add');
            const base = `/product/${product.id}`;
            navigate(base, { replace: true });
        }
    }, [isAuthorized, product]);

    // Gestion des états d'erreur et de chargement
    if (error) return <p>{error}</p>;
    if (!product) return <p>Chargement...</p>;  // Indicateur de chargement

    return (
        <div className="product-detail">
            {/* Bouton de retour */}
            <button className="back-btn" onClick={() => navigate(-1)}>← Retour</button>
            
            {/* Grille de détail du produit */}
            <div className="detail-grid">
                {/* Section image du produit */}
                <div className="detail-image">
                    <img 
                        src={product.image || 'https://via.placeholder.com/640x400?text=No+Image'}  // Image par défaut si manquante
                        alt={product.name} 
                        onError={(e) => { 
                            e.target.onerror = null;  // Évite les boucles d'erreur
                            e.target.src = 'https://via.placeholder.com/640x400?text=No+Image';  // Fallback image
                        }} 
                    />
                </div>
                
                {/* Section informations du produit */}
                <div className="detail-info">
                    <h1>{product.name}</h1>  {/* Nom du produit */}
                    <p className="detail-price">{product.price} XOF</p>  {/* Prix du produit */}
                    <p className="detail-desc">{product.description}</p>  {/* Description du produit */}
                    
                    {/* Métadonnées du produit */}
                    <div className="detail-meta">
                        <span>Quantité: {product.quantity}</span>  {/* Stock disponible */}
                        <span>Avis: {product.review_count || 0}</span>  {/* Nombre d'avis */}
                    </div>
                    
                    {/* Actions utilisateur */}
                    <div className="detail-actions">
                        <button className="add-to-cart-button" onClick={() => {
                            if (!isAuthorized) {
                                // Rediriger vers la page de login et demander d'ajouter au retour
                                const next = encodeURIComponent(`/product/${product.id}?add=1`);
                                navigate(`/login?next=${next}`);
                                return;
                            }
                            addToCart({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
                            toast.success(`${product.name} ajouté au panier`);
                        }}>Ajouter au panier</button>  {/* Bouton d'ajout au panier */}
                    </div>
                </div>
            </div>
            
            {/* Section recommandations de produits similaires */}
            <Recommendations productId={product.id} />
        </div>
    );
};

export default ProductDetail;