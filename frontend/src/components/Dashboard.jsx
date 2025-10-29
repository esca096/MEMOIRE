/**
 * Fichier: frontend/src/components/Dashboard.jsx
 *
 * Description (FR):
 * - Tableau de bord principal de l'utilisateur après connexion
 * - Affiche les informations personnelles, l'historique des commandes avec pagination
 * - Fournit des fonctionnalités administratives pour les utilisateurs staff
 * - Interface responsive avec cartes pour une présentation claire
 *
 * Fonctionnalités principales :
 * - Affichage des données utilisateur et statut administrateur
 * - Historique des commandes avec pagination
 * - Statistiques produits pour les administrateurs
 * - Navigation vers la gestion des produits (admin)
 * - Prévisualisation des produits récents
 *
 * Connexions :
 * - API backend pour les données utilisateur et commandes
 * - Contexte d'authentification pour les tokens
 * - React Router pour la navigation
 */

/**
 * Fichier: frontend/src/components/Dashboard.jsx
 * AVEC FONCTIONNALITÉ SUPPRESSION HISTORIQUE
 */

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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate();

    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage] = useState(5);
    const [totalOrders, setTotalOrders] = useState(0);

    // Récupération des données utilisateur
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

                const userResponse = await api.get('/dashboard/', {headers})
                const user = userResponse.data;
                setUserData(user);
                setIsAdmin(user.is_staff);

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

    // Récupération des commandes
    useEffect(() => {
        fetchOrders(currentPage);
    }, [currentPage]);

    // Fonction pour récupérer les commandes
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

    // NOUVELLE FONCTION : Supprimer l'historique des commandes
    const deleteOrderHistory = async () => {
        if (!isAdmin) {
            setError('Action réservée aux administrateurs');
            return;
        }

        setDeleting(true);
        try {
            const accessToken = localStorage.getItem(ACCESS_TOKEN);
            const headers = {
                Authorization: `Bearer ${accessToken}`,
            }

            // Appel à l'API pour supprimer l'historique
            const response = await api.delete('/api/delete_order_history/', { headers });
            
            if (response.status === 200) {
                // Réinitialiser les données locales
                setOrders([]);
                setTotalOrders(0);
                setCurrentPage(1);
                setShowDeleteConfirm(false);
                alert('Historique des commandes supprimé avec succès!');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'historique:', error);
            const errorMessage = error.response
                ? error.response.data.error || 'Une erreur sest produite lors de la suppression'
                : 'Une erreur sest produite: ' + error.message;
            setError(errorMessage);
        } finally {
            setDeleting(false);
        }
    };

    // Récupération du résumé des produits
    const fetchProductsSummary = async () => {
        try {
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

    // Gestion de la pagination
    const paginate = (pageNumber) => {
        if (pageNumber === currentPage) return;
        setCurrentPage(pageNumber);
    };

    if (loading) return <p>Loading .....</p>
    if (error) return <p className="error-message">{error}</p>

    // Rendu des données utilisateur
    const renderUserData  = () => (
        <div>
            <h2>Bienvenu, {userData.username}!</h2>
            {isAdmin && <p> Vous êtes un administrateur</p>}
            <p>Statut : {userData.is_active ? 'Active' : 'Inative'}</p>
        </div>
    );

    // Rendu des commandes AVEC BOUTON SUPPRESSION
    const renderOrders = () => (
        <div>
            <div className="orders-header">
                <h3>Commandes</h3>
                {isAdmin && orders.length > 0 && (
                    <button 
                        className="delete-history-btn"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={deleting}
                    >
                        {deleting ? 'Suppression...' : 'Supprimer l\'historique'}
                    </button>
                )}
            </div>
            
            {orders.length > 0 ? (
                <ul className="orders-list">
                    {orders.map((order) => (
                        <li key={order.id} className="order-item">
                            <div className="left">
                                <strong>Commande #{order.id}</strong>
                                <br />
                                Statut: {order.status}
                                <br />
                                Total: {order.total_price} XOF
                            </div>
                            <div className="right">
                                Client: {order.user.username}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-orders">Aucune commande trouvée.</p>
            )}
            
            {/* Pagination */}
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

    // Rendu des fonctionnalités administrateur
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
                <button onClick={() => navigate('/')}>Verifier vos produit !</button>
            </div>
        </div>
    )

    return (
        <div className="dashboard">
            <h1>Tableau de bord</h1>
            
            {/* Modal de confirmation de suppression */}
            {showDeleteConfirm && (
                <div className="modal-overlay">
                    <div className="confirm-modal">
                        <h3>Confirmer la suppression</h3>
                        <p>Êtes-vous sûr de vouloir supprimer tout l'historique des commandes ?</p>
                        <p className="warning-text">Cette action est irréversible !</p>
                        <div className="modal-actions">
                            <button 
                                className="confirm-btn"
                                onClick={deleteOrderHistory}
                                disabled={deleting}
                            >
                                {deleting ? 'Suppression...' : 'Oui, supprimer'}
                            </button>
                            <button 
                                className="cancel-btn"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
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
