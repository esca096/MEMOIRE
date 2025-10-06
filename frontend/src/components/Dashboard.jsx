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

import React, { useEffect, useState } from 'react';
import api from '../api';  // Client API Axios
import { useNavigate } from 'react-router-dom';  // Hook pour la navigation
import '../styles/Dashboard.css';  // Styles CSS du dashboard
import { ACCESS_TOKEN } from '../token';  // Constante du token d'accès

const Dashboard = () => {
    const [userData, setUserData] = useState(null);  // Données utilisateur
    const [orders, setOrders] = useState([]);  // Liste des commandes
    const [isAdmin, setIsAdmin] = useState(false);  // Statut administrateur
    const [error, setError] = useState(null);  // Gestion des erreurs
    const [loading, setLoading] = useState(true);  // État de chargement
    const [productCount, setProductCount] = useState(0);  // Nombre total de produits (admin)
    const [recentProducts, setRecentProducts] = useState([]);  // Produits récents (admin)
    const navigate = useNavigate();  // Hook pour la navigation

    // États pour la pagination des commandes
    const [currentPage, setCurrentPage] = useState(1);  // Page actuelle
    const [ordersPerPage] = useState(5);  // Nombre de commandes par page
    const [totalOrders, setTotalOrders] = useState(0);  // Total des commandes

    // Récupération des données utilisateur au montage du composant
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const accessToken = localStorage.getItem(ACCESS_TOKEN);
                if (!accessToken) {
                    throw new Error('Aucun jeton daccès trouvé');
                }

                const headers = {
                    Authorization: `Bearer ${accessToken}`,  // En-tête d'autorisation
                }

                // Récupération des données utilisateur
                const userResponse = await api.get('http://127.0.0.1:8000/dashboard/', {headers})
                const user = userResponse.data;
                setUserData(user);
                setIsAdmin(user.is_staff);  // Définition du statut admin

                // Si admin, récupération du résumé des produits
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
                setLoading(false);  // Arrêt du chargement
            }
        };
        fetchUserData();
    }, []);

    // Récupération des commandes quand la page change (pagination)
    useEffect(() => {
        fetchOrders(currentPage);
    }, [currentPage]);

    // Récupération des commandes avec pagination
    const fetchOrders = async (page) => {
        try {
            const accessToken = localStorage.getItem(ACCESS_TOKEN);
            const headers = {
            Authorization: `Bearer ${accessToken}`,
            }
            const ordersResponse = await api.get(`/api/user_view_orders/?page=${page}`, { headers });
            console.log("Réponse aux commandes", ordersResponse);

            setOrders(ordersResponse.data.results);  // Commandes de la page actuelle
            setTotalOrders(ordersResponse.data.count);  // Total des commandes
        } catch (error) {
            console.error('Erreur lors de la récupération des commandes:', error);
            const errorMessage = error.response
                ? error.response.data.detail || 'Une erreur sest produite lors de la récupération des commandes'
                : 'Une erreur sest produite: ' + error.message
            setError(errorMessage);
        }
    };

    // Récupération du résumé des produits pour les administrateurs
    const fetchProductsSummary = async () => {
        try {
            // L'endpoint public des produits est paginé ; récupère la première page
            const res = await api.get('/products/?page=1');
            const data = res.data;
            if (data) {
                if (Array.isArray(data)) {
                    setProductCount(data.length);  // Nombre de produits
                    setRecentProducts(data.slice(0,3));  // 3 produits récents
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
        if (pageNumber === currentPage) return;  // Évite le rechargement si même page
        setCurrentPage(pageNumber);
        // fetchOrders sera appelé par le useEffect surveillant currentPage
    };

    // Gestion des états de chargement et d'erreur
    if (loading) return <p>Loading .....</p>  // Indicateur de chargement
    if (error) return <p className="error-message">{error}</p>  // Affichage des erreurs

    // Rendu des données utilisateur
    const renderUserData  = () => (
        <div>
            <h2>Bienvenu, {userData.username}!</h2>  {/* Message de bienvenue personnalisé */}
            {isAdmin && <p> Vous êtes un administrateur</p>}  {/* Indication statut admin */}
            <p>Statut : {userData.is_active ? 'Active' : 'Inative'}</p>  {/* Statut du compte */}
        </div>
    );

    // Rendu des commandes avec pagination
    const renderOrders = () => (
        <div>
            <h3>Commandes</h3>
            {orders.length > 0 ? (
                <ul>
                    {orders.map((order) => (
                        <li key={order.id}>
                            Commandes # {order.id} - {order.status} - Total: {order.total_price} XOF
                            - par {order.user.username}  {/* Détails de chaque commande */}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Aucune commande trouvée.</p>  
            )}
            {/* Pagination des commandes */}
            <div className='pagination'>
                {totalOrders > ordersPerPage && (
                    Array.from({length: Math.ceil(totalOrders / ordersPerPage)}, (_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => paginate(index + 1)}
                            disabled={currentPage === index + 1}  // Désactive le bouton de la page actuelle
                        >
                            {index + 1}  {/* Numéro de page */}
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
                    {/* Carte nombre total de produits */}
                    <div className="prod-count card">
                        <h4>{productCount}</h4>
                        <p>Produits totaux</p>
                    </div>
                    {/* Carte produits récents */}
                    <div className="recent-products card">
                        <h4>Derniers produits</h4>
                        <div className="recent-list">
                            {recentProducts.map(p => (
                                <div key={p.id} className="recent-item">
                                    <img src={p.image} alt={p.name} />  {/* Image du produit */}
                                    <div className="meta">
                                        <div className="name">{p.name}</div>  {/* Nom du produit */}
                                    </div>
                                </div>
                            ))}
                            {recentProducts.length === 0 && <p>Aucun aperçu</p>}  {/* Message si aucun produit */}
                        </div>
                    </div>
                </div>
                {/* Actions administrateur */}
                <div className="admin-actions"> 
                    <button onClick={() => navigate('/api/products')}>Gérer les produits</button>  {/* Navigation gestion produits */}
                    <button onClick={() => navigate('/')}>Verifier vos produit !</button>  {/* Navigation page d'accueil */}
                </div>
            </div>
    )

    return (
        <div className="dashboard">
            <h1>Tableau de bord</h1>
            <div className="dashboard-grid">
                {/* Carte informations utilisateur */}
                <div className="card user-card">
                    {renderUserData()}
                    {isAdmin && renderAdminFeatures()}  {/* Fonctionnalités admin conditionnelles */}
                </div>
                {/* Carte commandes */}
                <div className="card orders-card">
                    {renderOrders()}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;