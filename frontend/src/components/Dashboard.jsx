import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import { ACCESS_TOKEN } from '../token';

const Dashboard = () => {
    const [userData, setUserData] = useState(null);
    const [orders, setOrders] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [productCount, setProductCount] = useState(0);
    const [recentProducts, setRecentProducts] = useState([]);
    const navigate = useNavigate();

    //pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage] = useState(5); // Number of orders per page
    const [totalOrders, setTotalOrders] = useState(0);


    // Fetch user data once on mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const accessToken = localStorage.getItem(ACCESS_TOKEN);
                if (!accessToken) {
                    throw new Error('Aucun jeton daccès trouvé');
                }

                const headers = {
                    Authorization: `Bearer ${accessToken}`,
                }

                // Fetch user data
                const userResponse = await api.get('http://127.0.0.1:8000/dashboard/', {headers})
                const user = userResponse.data;
                setUserData(user);
                setIsAdmin(user.is_staff);

                // if admin, fetch a small product preview/count for admin card
                if (user.is_staff) {
                    fetchProductsSummary();
                }
            } catch(error){
                console.error('Erreur lors de la récupération des données utilisateur:', error);
                const errorMessage = error.response
                    ? error.response.data.detail || 'Une erreur sest produite lors de la récupération des données utilisateur'
                    : 'Une erreur sest produite: ' + error.message;
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    // Fetch orders whenever currentPage changes (pagination)
    useEffect(() => {
        fetchOrders(currentPage);
    }, [currentPage]);

    const fetchOrders = async (page) => {
        try {
            const accessToken = localStorage.getItem(ACCESS_TOKEN);
            const headers = {
            Authorization: `Bearer ${accessToken}`,
            }
            const ordersResponse = await api.get(`/api/user_view_orders/?page=${page}`, { headers });
            console.log("Réponse aux commandes", ordersResponse);

            setOrders(ordersResponse.data.results);
            setTotalOrders(ordersResponse.data.count);
        } catch (error) {
            console.error('Erreur lors de la récupération des commandes:', error);
            const errorMessage = error.response
                ? error.response.data.detail || 'Une erreur sest produite lors de la récupération des commandes'
                : 'Une erreur sest produite: ' + error.message
            setError(errorMessage);
        }
    };

    const fetchProductsSummary = async () => {
        try {
            // public products endpoint is paginated; get first page
            const res = await api.get('/products/?page=1');
            const data = res.data;
            if (data) {
                if (Array.isArray(data)) {
                    setProductCount(data.length);
                    setRecentProducts(data.slice(0,3));
                } else if (Array.isArray(data.results)) {
                    setProductCount(data.count || data.results.length);
                    setRecentProducts(data.results.slice(0,3));
                }
            }
        } catch (err) {
            console.error('Error fetching products summary:', err);
        }
    }

    const paginate = (pageNumber) => {
        if (pageNumber === currentPage) return;
        setCurrentPage(pageNumber);
        // fetchOrders will be invoked by the useEffect watching currentPage
    };

    // set loading or error handing
    if (loading) return <p>Loading .....</p>
    if (error) return <p className="error-message">{error}</p>


    // set up function to render user data
    const renderUserData  = () => (
        <div>
            <h2>Bienvenu, {userData.username}!</h2>
            {isAdmin && <p> Vous êtes un administrateur</p>}
            <p>Statut : {userData.is_active ? 'Active' : 'Inative'}</p>
        </div>
    );

    const renderOrders = () => (
        <div>
            <h3>Commandes</h3>
            {orders.length > 0 ? (
                <ul>
                    {orders.map((order) => (
                        <li key={order.id}>
                            Commandes # {order.id} - {order.status} - Total: {order.total_price} XOF
                            - par {order.user.username}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Aucune commande trouvée.</p>
            )}
            <div className='pagination'>
                {totalOrders > ordersPerPage && (
                    Array.from({length: Math.ceil(totalOrders / ordersPerPage)}, (_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => paginate(index + 1)}
                            disabled={currentPage === index + 1}
                        >
                            {index + 1}
                        </button>
                    ))
                )}
            </div>
        </div>
    )

    const renderAdminFeatures = () => (
            <div>
                <h3>Fonctionnalités d'administration</h3>
                <div className="admin-summary">
                    <div className="prod-count card">
                        <h4>{productCount}</h4>
                        <p>Produits totaux</p>
                    </div>
                    <div className="recent-products card">
                        <h4>Derniers produits</h4>
                        <div className="recent-list">
                            {recentProducts.map(p => (
                                <div key={p.id} className="recent-item">
                                    <img src={p.image} alt={p.name} />
                                    <div className="meta">
                                        <div className="name">{p.name}</div>
                                    </div>
                                </div>
                            ))}
                            {recentProducts.length === 0 && <p>Aucun aperçu</p>}
                        </div>
                    </div>
                </div>
                <div className="admin-actions"> 
                    <button onClick={() => navigate('/api/products')}>Gérer les produits</button>
                    <button onClick={() => navigate('/')}>Verifier vos</button>
                </div>
            </div>
    )

    return (
        <div className="dashboard">
            <h1>Tableau de bord</h1>
            <div className="dashboard-grid">
                <div className="card user-card">
                    {renderUserData()}
                    {isAdmin && renderAdminFeatures()}
                </div>
                <div className="card orders-card">
                    {renderOrders()}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;