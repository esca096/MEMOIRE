/**
 * Fichier: frontend/src/components/ReviewForm.jsx
 *
 * Description (FR):
 * - Formulaire de soumission d'avis pour les produits après une commande
 * - Récupère automatiquement l'ID du produit depuis les détails de commande
 * - Permet à l'utilisateur de noter (1-5 étoiles) et commenter un produit
 * - Redirige vers le tableau de bord après soumission réussie
 *
 * Fonctionnalités principales :
 * - Récupération automatique du produit depuis la commande
 * - Notation numérique de 1 à 5 étoiles
 * - Champ de commentaire texte
 * - Validation des données et gestion des erreurs
 * - Notifications de succès/échec avec toast
 *
 * Connexions :
 * - API backend pour les détails de commande et soumission d'avis
 * - Système d'authentification via token JWT
 * - React Router pour la navigation et les paramètres d'URL
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';  // Hooks pour paramètres URL et navigation
import { ToastContainer, toast } from 'react-toastify';  // Système de notifications
import 'react-toastify/dist/ReactToastify.css';  // Styles des notifications
import api from '../api';  // Client API Axios
import '../styles/ReviewForm.css';  // Styles CSS du formulaire d'avis
import { ACCESS_TOKEN } from '../token';  // Constante du token d'accès

const ReviewForm = () => {
    const { id } = useParams();  // Récupération de l'ID de commande depuis l'URL
    const [rating, setRating] = useState(0);  // État pour la note (1-5)
    const [review, setReview] = useState('');  // État pour le commentaire
    const [productId, setProductId] = useState(null);  // État pour l'ID du produit
    const [error, setError] = useState(null);  // Gestion des erreurs

    const navigate = useNavigate();  // Hook pour la navigation

    // Récupération des détails de commande pour obtenir l'ID du produit
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const token = localStorage.getItem(ACCESS_TOKEN);
                console.log('fetching order', id)
                const response = await api.get(`/api/orders/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }  // En-tête d'authentification
                });
                console.log('order details', response.data);

                const products = response.data.products;

                if (products && products.length > 0) {
                    setProductId(products[0].id);  // Prend le premier produit de la commande
                    console.log('Product ID:', products[0].id);
                } else {
                    console.log('No products found in the order');
                }
            } catch (error) {
                setError('Failed to fetch order details');  // Gestion d'erreur
                console.error('Error fetching order details:', error);
            }
        };
        fetchOrderDetails();
    }, [id]);  // Déclenché quand l'ID de commande change


    // Soumission du formulaire d'avis
    const handleSumit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validation des champs obligatoires
        if (!rating || !review || !productId){
            setError('Please provide a rating, review or product to ensure that the order is correct');
            return;
        }

        try {
            const token = localStorage.getItem(ACCESS_TOKEN);
            console.log('access token', token);
            const payload = {
                product: productId,  // ID du produit à évaluer
                rating: rating,      // Note de 1 à 5
                comment: review,     // Commentaire texte
            };
            console.log('payload', payload);

            // Soumission de l'avis via l'API
            await api.post('/reviews/', payload, {
                headers: { 'Authorization': `Bearer ${token}` },  // Authentification requise
            });

            // Notification de succès
            toast.success('Review submitted successfully!', {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            setRating(0);      // Réinitialisation de la note
            setReview('');     // Réinitialisation du commentaire
            navigate('/dashboard'); // Redirection vers le tableau de bord après soumission réussie
        } catch (error) {
            setError('Failed to submit review');  // Gestion d'erreur de soumission
            console.error('Error submitting review:', error.response?.data || error.message);
            toast.error('Failed to submit review', {  // Notification d'erreur
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };

    return (
        <div className="review-form">
            <ToastContainer />  {/* Container pour les notifications toast */}
            <h2>Réviser la commande</h2>  {/* Titre du formulaire */}
            {error && <p className="error-message">{error}</p>}  {/* Affichage des erreurs */}
            <form onSubmit={handleSumit}>
                {/* Champ de notation */}
                <div className="form-group">
                    <label>Notation:</label>
                    <input
                        type="number"
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}  // Mise à jour de la note
                        min="1"
                        max="5"
                        required
                    />
                </div>
                {/* Champ de commentaire */}
                <div className="form-group">
                    <label>Avis:</label>
                    <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}  // Mise à jour du commentaire
                        required
                    />
                </div>
                {/* Bouton de soumission */}
                <button type="submit" className="submit-button">Soumettre l'avis</button>
            </form>
        </div>
    );
}

export default ReviewForm;