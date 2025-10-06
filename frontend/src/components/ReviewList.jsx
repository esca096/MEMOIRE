/**
 * Fichier: frontend/src/components/ReviewsList.jsx
 *
 * Description (FR):
 * - Composant d'affichage de la liste des avis pour un produit
 * - Affiche les avis des utilisateurs avec notation, commentaire et date
 * - Design en cartes pour une présentation claire et organisée
 * - Gère le cas où il n'y a pas d'avis disponibles
 *
 * Fonctionnalités principales :
 * - Affichage de tous les avis d'un produit
 * - Formatage des dates en format local
 * - Structure en cartes pour chaque avis
 * - Message d'information si aucun avis
 *
 * Connexions :
 * - Utilisé par Products.jsx pour afficher les avis des produits
 * - Reçoit les données d'avis via les props
 * - Style cohérent avec le design global de l'application
 */

import React from 'react';
import '../styles/ReviewForm.css';  // Styles CSS partagés pour les avis


const ReviewsList = ({ reviews }) => {
    return (
        <div className="reviews-list">
            <h2>Avis</h2>  {/* Titre de la section des avis */}
            {reviews.length > 0 ? (
                <div>
                    {reviews.map((review) => (
                        <div key={review.id} className="review-card">  {/* Carte individuelle pour chaque avis */}
                            <p><strong>Utilisateur:</strong>{review.user}</p>  {/* Nom de l'utilisateur */}
                            <p><strong>Notation:</strong> {review.rating} starts</p>  {/* Note sur 5 étoiles */}
                            <p><strong>Commentaire:</strong>{review.comment}</p>  {/* Commentaire texte */}
                            <p><strong>Soumis le:</strong>{new Date (review.created_at).toLocaleDateString()}</p>  {/* Date formatée */}
                        </div>
                    ))}
                </div>
            ) : (
                <p>Aucun avis trouvé.</p>
            )}
        </div>
    );
};
export default ReviewsList;