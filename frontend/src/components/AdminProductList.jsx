/**
 * Fichier: AdminProductList.jsx (Gestion des produits administrateur)
 * 
 * Description (FR):
 * - Interface complète de gestion du catalogue produits pour les administrateurs
 * - Combine la liste des produits existants et le formulaire d'ajout
 * - Permet l'ajout, la visualisation et la suppression de produits
 * 
 * Fonctionnalités principales :
 * - Affichage de la liste des produits avec images
 * - Formulaire d'ajout de nouveau produit avec prévisualisation d'image
 * - Upload d'images avec gestion de prévisualisation
 * - Suppression de produits avec confirmation
 * - Navigation vers l'édition de produit
 * 
 * Connexions :
 * - Route protégée '/api/products' dans App.jsx
 * - API backend pour les opérations CRUD sur les produits
 * - Système de navigation pour la redirection vers l'édition
 */

// for listing products and adding products

import React, { useEffect, useState } from 'react';
import api from '../api';
import { ACCESS_TOKEN } from '../token';
import '../styles/AdminProducts.css';
import {toast} from 'react-toastify';
import { useNavigate } from 'react-router-dom';


const AdminProductList = () => {
    const [products, setProducts] = useState([]);  // Liste des produits
    const [newProduct, setNewProduct] = useState({ name: "", description: "", price: "", quantity: "" });  // Nouveau produit
    const [image, setImage] = useState(null);  // Fichier image sélectionné
    const [imagePreview, setImagePreview] = useState(null);  // URL de prévisualisation de l'image
    const [error, setError] = useState(null);  // Gestion des erreurs
    const navigate = useNavigate();  // Navigation programmatique

    // Récupération des produits existants
    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem(ACCESS_TOKEN);
            console.log('Access Token Available:', token); // Log du token pour le débogage
            if (!token) {
                throw new Error('No access token found');
            }
            const res = await api.get('/api/products/', {
                headers: { Authorization: `Bearer ${token}` },
            })
            console.log('Fetched products:', res.data); // Log des produits récupérés
            // L'API peut retourner un tableau simple ou un objet paginé { count, next, results }
            const fetched = res.data;
            if (Array.isArray(fetched)) {
                setProducts(fetched);
            } else if (fetched && Array.isArray(fetched.results)) {
                setProducts(fetched.results);
            } else {
                // Retour à un tableau vide pour éviter les erreurs "not iterable"
                setProducts([]);
            }
        } catch (error) {
            console.error('Error getting products:', error);
            setError(error);
            toast.error('Failed to fetch products.');
        }
    };

    // Chargement des produits au montage du composant
    useEffect(() => {
        fetchProducts();
    }, []);


    // Gestion des changements dans le formulaire d'ajout
    const handleInputChange = (e) => {
        setNewProduct({...newProduct, [e.target.name]: e.target.value });
    };

    // Gestion du téléchargement d'image
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImage(file);
        if (file) {
            setImagePreview(URL.createObjectURL(file));  // Création d'une URL de prévisualisation
        } else {
            setImagePreview(null);
        }
    };

    // Soumission du formulaire d'ajout de produit
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem(ACCESS_TOKEN);
            if (!token) {
                throw new Error('No access token found');
            }
            // Préparation des données FormData pour l'envoi de fichier
            const formData = new FormData();
            formData.append('name', newProduct.name);
            formData.append('description', newProduct.description);
            formData.append('price', newProduct.price);
            formData.append('quantity', newProduct.quantity);
            if (image) {
                formData.append('image', image);  // Ajout de l'image si sélectionnée
            }

            const res = await api.post('/api/products/', formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',  // Header pour l'upload de fichiers
                },
            });
            console.log('Create product response:', res);
            // Si l'API retourne l'objet produit créé, l'ajouter. Sinon rafraîchir la liste.
            if (res && res.data && res.data.id) {
                setProducts(prev => Array.isArray(prev) ? [...prev, res.data] : [res.data]);
            } else {
                // Si le serveur ne retourne pas de body, recharger les produits depuis le serveur
                await fetchProducts();
            }
            setNewProduct({ name: "", description: "", price: "", quantity: "" }); // Réinitialisation du formulaire
            setImage(null);
            setImagePreview(null);
            toast.success('Product added successfully!');
        } catch (error) {
            console.error('Error adding product:', error);
            setError('Failed to add product.');
            toast.error('Failed to add product.');
        }
    };

    // Suppression d'un produit
    const handleDeleteProduct = async (id) => {
        const ok = window.confirm('Confirmer la suppression de ce produit ?');
        if (!ok) return;
        try {
            const token = localStorage.getItem(ACCESS_TOKEN);
            if (!token) throw new Error('No access token');
            // Assurer le slash final pour l'endpoint Django
            await api.delete(`/api/products/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Produit supprimé');
            await fetchProducts();  // Rafraîchissement de la liste après suppression
        } catch (err) {
            console.error('Error deleting product:', err);
            const msg = err.response && err.response.data ? (err.response.data.detail || JSON.stringify(err.response.data)) : 'Impossible de supprimer le produit';
            toast.error(msg);
        }
    };
    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <div className="admin-container">
            <h1>Gérer les produits</h1>

            <div className="admin-list-grid">
                {/* Section liste des produits existants */}
                <div className="card product-list-card">
                    <div className="product-list">
                        {products.length > 0 ? (
                            products.map((product) => (
                                <div key={product.id} className="product-card-admin">
                                    <div className="thumb">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} />  
                                        ) : (
                                            <div className="thumb-empty">No image</div>  
                                        )}
                                    </div>
                                    <div className="info">
                                        <div className="name">{product.name}</div>
                                        <div className="price">{product.price} XOF</div>
                                    </div>
                                    <div className="actions-mini">
                                        <button type="button" onClick={() => navigate(`/api/products/${product.id}`)} className="btn-small">Éditer</button>  {/* Navigation édition */}
                                        <button type="button" onClick={() => handleDeleteProduct(product.id)} className="btn-small danger">Supprimer</button>  {/* Bouton suppression */}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>Aucun produit trouvé.</p>  
                        )}
                    </div>
                </div>

                {/* Section formulaire d'ajout de produit */}
                <div className="card add-form-card">
                    <h3>Ajouter un produit</h3>
                    <form onSubmit={handleSubmit}>
                        <label>Nom</label>
                        <input type="text" name="name" value={newProduct.name} onChange={handleInputChange} required />

                        <label>Description</label>
                        <input type="text" name="description" value={newProduct.description} onChange={handleInputChange} required />

                        <div className="row">
                            <div style={{flex:1}}>
                                <label>Prix</label>
                                <input type="number" name="price" value={newProduct.price} onChange={handleInputChange} required />
                            </div>
                            <div style={{width:16}} />
                            <div style={{flex:1}}>
                                <label>Quantité</label>
                                <input type="number" name="quantity" value={newProduct.quantity} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <label>Image</label>
                        <input type="file" name="image" accept="image/*" onChange={handleImageChange} />  {/* Input fichier image */}
                        {imagePreview && (
                            <div className="preview-box">
                                <img src={imagePreview} alt="preview" />  {/* Prévisualisation de l'image */}
                            </div>
                        )}

                        <div style={{marginTop:12}}>
                            <button type="submit" className="btn-primary">Ajouter produit</button>  {/* Bouton soumission */}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
export default AdminProductList;