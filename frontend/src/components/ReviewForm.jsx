import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../api';
import '../styles/ReviewForm.css';
import { ACCESS_TOKEN } from '../token';

const ReviewForm = () => {
    const { id } = useParams();
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [productId, setProductId] = useState(null);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    // fetch order details to get the product id
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const token = localStorage.getItem(ACCESS_TOKEN);
                console.log('fetching order', id)
                const response = await api.get(`/api/orders/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log('order details', response.data);

                const products = response.data.products;

                if (products && products.length > 0) {
                    setProductId(products[0].id);
                    console.log('Product ID:', products[0].id);
                } else {
                    console.log('No products found in the order');
                }
            } catch (error) {
                setError('Failed to fetch order details');
                console.error('Error fetching order details:', error);
            }
        };
        fetchOrderDetails();
    }, [id]);


    const handleSumit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!rating || !review || !productId){
            setError('Please provide a rating, review or product to ensure that the order is correct');
            return;
        }

        try {
            const token = localStorage.getItem(ACCESS_TOKEN);
            console.log('access token', token);
            const payload = {
                product: productId,
                rating: rating,
                comment: review,
            };
            console.log('payload', payload);

            await api.post('/reviews/', payload, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            toast.success('Review submitted successfully!', {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            setRating(0);
            setReview('');
            navigate('/dashboard'); // Redirect to dashboard after successful submission
        } catch (error) {
            setError('Failed to submit review');
            console.error('Error submitting review:', error.response?.data || error.message);
            toast.error('Failed to submit review', {
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
            <ToastContainer />
            <h2>Réviser la commande</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSumit}>
                <div className="form-group">
                    <label>Notation:</label>
                    <input
                        type="number"
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                        min="1"
                        max="5"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Avis:</label>
                    <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="submit-button">Soumettre l'avis</button>
            </form>
        </div>
    );
}

export default ReviewForm;