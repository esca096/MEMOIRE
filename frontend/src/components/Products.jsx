import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import '../styles/Products.css';
import { useCart } from './CartContext';
import { useAuthentication } from '../auth'; 
import { useNavigate, Link } from 'react-router-dom';
import ReviewsList from './ReviewList';


const Products = () => {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { addToCart } = useCart();
    const { isAuthorized } = useAuthentication();
    const navigate = useNavigate();
    const [reviews, setReviews] = useState({});
    const [loadingReviews, setLoadingReviews] = useState({});



    const [debugResponse, setDebugResponse] = useState(null);
    const PAGE_SIZE = 8; // should match server-side PAGE_SIZE

    const fetchProducts = async (page = 1) => {
       try {
           // Use DRF page parameter; PAGE_SIZE is configured server-side (5)
           const res = await api.get(`/products/?page=${page}`);
           console.log('Products API response:', res.data);
           setDebugResponse(res.data);
           const fetched = res.data;
           if (Array.isArray(fetched)) {
               setProducts(fetched);
           } else if (fetched && Array.isArray(fetched.results)) {
               setProducts(fetched.results);
           } else {
               // Unexpected shape — fall back to empty array
               setProducts([]);
           }
           setCurrentPage(page);
       } catch (error) {
           console.error('Error fetching products:', error);
           setError(error.message);
           toast.error('Failed to load products.');
       }
    };

    useEffect(() => {
       fetchProducts(currentPage);
    }, []);

    // fetch reveiws for each product
    const fetchReviews = async (productId) => {
        try {
            const response = await api.get('/products/' + productId +'/reviews/');
            setReviews((prev) => ({ ...prev, [productId]: response.data }));
            setLoadingReviews((prev) => ({ ...prev, [productId]: true }));
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setError('Failed to load reviews.');
        } finally {
            setLoadingReviews((prev) => ({ ...prev, [productId]: false }));
        }
    }

    // Function to handle adding a product to the cart
    const handleAddToCart = (product) => {
        if (!isAuthorized) {
            navigate('/login'); // Redirect to login page if not authorized
        } else {
            const item = { ...product, quantity: 1 }; // default to 1 item
            addToCart(item);

            // Show success notification
            toast.success(`${product.name} added to cart!`, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };

    // set handler for seeng reviews
    const handleViewReviews = (productId) => {
        if (!reviews[productId]) {
            fetchReviews(productId);
        }
        console.log(`fetching reviews for products id:${productId}`);
    }
    
    if (error) {
        return <p>{error}</p>;
    }

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
                            <div className="product-image">
                                <img 
                                    src={product.image} 
                                    alt={product.name}
                                />
                            </div>
                            <h3>{product.name}</h3>
                            <p>{truncate(product.description, 20)}</p>
                            <p><strong>Prix:</strong>{product.price} XOF</p>
                            <p><strong>Avis:</strong>{product.review_count || 0} Avis</p>
                            <p><strong>Notation:</strong>{product.average_rating || "Pas encore de note"}</p>

                            <button onClick={() => handleViewReviews(product.id)} className="see-reviexs-btn">
                                Voir les avis
                            </button>

                            {loadingReviews[product.id] ? (
                                <p>Chargement des avis...</p>
                            ) : (
                                reviews[product.id] && <ReviewsList reviews={reviews[product.id]} />
                            )}

                            <div className="actions">
                                <Link to={`/product/${product.id}`} state={{ product }} className="see-reviexs-btn">
                                    Voir
                                </Link>
                                <button onClick={() => handleAddToCart(product)} className="add-to-cart-button">
                                    Ajouter au panier
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div>
                        <p>Aucun produit disponible.</p>
                        {debugResponse && (
                            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                                {JSON.stringify(debugResponse, null, 2)}
                            </pre>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination controls */}
            {debugResponse && ( (debugResponse.next || debugResponse.previous) || (debugResponse.count && debugResponse.count > PAGE_SIZE) ) && (
                <div className="pagination-controls" style={{ marginTop: 16 }}>
                    <button
                        onClick={() => fetchProducts(currentPage - 1)}
                        disabled={!debugResponse.previous || currentPage <= 1}
                    >
                        Précédent
                    </button>
                    <span style={{ margin: '0 12px' }}>Page {currentPage}{debugResponse.count ? ` / ${Math.max(1, Math.ceil(debugResponse.count / PAGE_SIZE))}` : ''}</span>
                    <button
                        onClick={() => fetchProducts(currentPage + 1)}
                        disabled={!debugResponse.next}
                    >
                        Suivant
                    </button>
                </div>
            )}
        </div>
    );
};
export default Products;