import React from 'react';
import '../styles/ReviewForm.css';


const ReviewsList = ({ reviews }) => {
    return (
        <div className="reviews-list">
            <h2>Avis</h2>
            {reviews.length > 0 ? (
                <div>
                    {reviews.map((review) => (
                        <div key={review.id} className="review-card">
                            <p><strong>Utilisateur:</strong>{review.user}</p>
                            <p><strong>Notation:</strong> {review.rating} starts</p>
                            <p><strong>Commentaire:</strong>{review.comment}</p>
                            <p><strong>Soumis le:</strong>{new Date (review.created_at).toLocaleDateString()}</p>
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