/**
 * Fichier: frontend/src/components/Products.jsx
 *
 * Description (FR):
 * - Composant qui affiche les produits en vedette sur la page d'accueil.
 * - Récupère la liste paginée des produits depuis l'API (`/products/`).
 * - Fournit la fonctionnalité "Voir" (détail) et "Ajouter au panier" pour chaque produit.
 * - Utilise `useCart()` pour ajouter des articles au panier (qui sera synchronisé
 *   avec le backend via `api/cart/`).
 *
 * Interactions principales :
 * - `api` (axios) effectue la requête GET pour récupérer les produits.
 * - `useAuthentication()` est consulté pour savoir si l'utilisateur est connecté
 *   avant d'autoriser l'ajout au panier (redirection vers `/login` si non connecté).
 */

import React, { useState, useEffect } from 'react';
import api from '../api';  // Client API Axios
import { toast } from 'react-toastify';  // Système de notifications
import "react-toastify/dist/ReactToastify.css";  // Styles des notifications
import '../styles/Products.css';  // Styles CSS des produits
import { useCart } from './CartContext';  // Contexte du panier
import { useAuthentication } from '../auth';   // Hook d'authentification
import { useNavigate, Link } from 'react-router-dom';  // Hooks de navigation
import ReviewsList from './ReviewList';  // Composant d'affichage des avis


const Products = () => {
    const [products, setProducts] = useState([]);  // Liste des produits
    const [error, setError] = useState(null);  // Gestion des erreurs
    const [currentPage, setCurrentPage] = useState(1);  // Page actuelle pour la pagination
    const { addToCart } = useCart();  // Fonction d'ajout au panier
    const { isAuthorized } = useAuthentication();  // Statut d'authentification
    const navigate = useNavigate();  // Hook pour la navigation
    const [reviews, setReviews] = useState({});  // Avis par produit (stockage par ID)
    const [loadingReviews, setLoadingReviews] = useState({});  // État de chargement des avis par produit

    const [debugResponse, setDebugResponse] = useState(null);  // Réponse API pour le débogage
    const PAGE_SIZE = 8;  // Doit correspondre au PAGE_SIZE côté serveur

    // Récupération des produits depuis l'API avec pagination
    const fetchProducts = async (page = 1) => {
       try {
           // Utilise le paramètre page de DRF ; PAGE_SIZE est configuré côté serveur (5)
           const res = await api.get(`/products/?page=${page}`);
           console.log('Products API response:', res.data);
           setDebugResponse(res.data);
           const fetched = res.data;
           if (Array.isArray(fetched)) {
               setProducts(fetched);
           } else if (fetched && Array.isArray(fetched.results)) {
               setProducts(fetched.results);
           } else {
               // Forme inattendue — retour à un tableau vide
               setProducts([]);
           }
           setCurrentPage(page);
       } catch (error) {
           console.error('Error fetching products:', error);
           setError(error.message);
           toast.error('Failed to load products.');  // Notification d'erreur
       }
    };

    // Chargement initial des produits
    useEffect(() => {
       fetchProducts(currentPage);
    }, []);

    // Récupération des avis pour un produit spécifique
    const fetchReviews = async (productId) => {
        try {
            const response = await api.get('/products/' + productId +'/reviews/');
            setReviews((prev) => ({ ...prev, [productId]: response.data }));  // Stockage des avis par ID produit
            setLoadingReviews((prev) => ({ ...prev, [productId]: true }));  // Marquage comme chargé
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setError('Failed to load reviews.');
        } finally {
            setLoadingReviews((prev) => ({ ...prev, [productId]: false }));  // Fin du chargement
        }
    }

    // Fonction pour gérer l'ajout d'un produit au panier
    const handleAddToCart = (product) => {
        if (!isAuthorized) {
            navigate('/login'); // Redirection vers la page de login si non autorisé
            return;
        }
        const item = { id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 };
        addToCart(item);

        // Affichage de la notification de succès (français)
        toast.success(`${product.name} ajouté au panier`, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    // Gestionnaire pour voir les avis
    const handleViewReviews = (productId) => {
        if (!reviews[productId]) {
            fetchReviews(productId);  // Chargement des avis si pas déjà chargés
        }
        console.log(`fetching reviews for products id:${productId}`);
    }
    
    // Affichage des erreurs
    if (error) {
        return <p>{error}</p>;
    }

    // Fonction de troncation du texte pour les descriptions
    const truncate = (text, max = 120) => {
        if (!text) return '';
        return text.length > max ? text.slice(0, max).trim() + '...' : text;
    }

    return (
        <div>
            <h1>Produits en vedette</h1>
            <div className="product-grid">
                {products.length > 0 ? (
                    products.map((product) => (
                        <div key={product.id} className="product-card">
                            {/* Image du produit */}
                            <div className="product-image">
                                <img
                                    src={product.image || 'https://via.placeholder.com/320x200?text=No+Image'}
                                    alt={product.name}
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/320x200?text=No+Image'; }}  // Fallback image
                                />
                            </div>
                            <h3>{product.name}</h3>  {/* Nom du produit */}
                            <p>{truncate(product.description, 20)}</p>  {/* Description tronquée */}
                            <p><strong>Prix:</strong>{product.price} XOF</p>  {/* Prix */}
                            <p><strong>Avis:</strong>{product.review_count || 0} Avis</p>  {/* Nombre d'avis */}
                            <p><strong>Notation:</strong>{product.average_rating || "Pas encore de note"}</p>  {/* Note moyenne */}

                            {/* Bouton pour voir les avis */}
                            <button onClick={() => handleViewReviews(product.id)} className="see-reviexs-btn">
                                Voir les avis
                            </button>

                            {/* Affichage des avis avec état de chargement */}
                            {loadingReviews[product.id] ? (
                                <p>Chargement des avis...</p>  
                            ) : (
                                reviews[product.id] && <ReviewsList reviews={reviews[product.id]} />  
                            )}

                            {/* Actions sur le produit */}
                            <div className="actions">
                                <Link to={`/product/${product.id}`} state={{ product }} className="see-reviexs-btn">
                                    Voir  {/* Lien vers la page détail */}
                                </Link>
                                <button onClick={() => handleAddToCart(product)} className="add-to-cart-button">
                                    Ajouter au panier  {/* Bouton d'ajout au panier */}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div>
                        <p>Aucun produit disponible.</p>
                        {/* Affichage du débogage si disponible */}
                        {debugResponse && (
                            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                                {JSON.stringify(debugResponse, null, 2)}
                            </pre>
                        )}
                    </div>
                )}
            </div>

            {/* Contrôles de pagination */}
            {debugResponse && ( (debugResponse.next || debugResponse.previous) || (debugResponse.count && debugResponse.count > PAGE_SIZE) ) && (
                <div className="pagination-controls" style={{ marginTop: 16 }}>
                    <button
                        onClick={() => fetchProducts(currentPage - 1)}
                        disabled={!debugResponse.previous || currentPage <= 1}  // Désactivé si pas de page précédente
                    >
                        Précédent  {/* Bouton page précédente */}
                    </button>
                    <span style={{ margin: '0 12px' }}>Page {currentPage}{debugResponse.count ? ` / ${Math.max(1, Math.ceil(debugResponse.count / PAGE_SIZE))}` : ''}</span>  {/* Indicateur de page */}
                    <button
                        onClick={() => fetchProducts(currentPage + 1)}
                        disabled={!debugResponse.next}  // Désactivé si pas de page suivante
                    >
                        Suivant  {/* Bouton page suivante */}
                    </button>
                </div>
            )}
        </div>
    );
};
export default Products;