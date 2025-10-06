/**
 * Fichier: AdminProductEdit.jsx (Édition de produit administrateur)
 * 
 * Description (FR):
 * - Composant pour la modification et suppression des produits par l'administrateur
 * - Interface complète d'édition avec prévisualisation en temps réel
 * - Gère le téléchargement d'images et la mise à jour des données produit
 * 
 * Fonctionnalités principales :
 * - Récupération des données du produit à éditer
 * - Formulaire de modification avec prévisualisation
 * - Upload d'image avec remplacement
 * - Mise à jour et suppression du produit
 * - Notifications toast pour le feedback utilisateur
 * 
 * Connexions :
 * - Route protégée '/api/products/:id' dans App.jsx
 * - API backend pour les opérations CRUD sur les produits
 * - Système de navigation pour le retour à la liste
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import '../styles/AdminProducts.css';

const AdminProductEdit = () => {
    const {id} = useParams();  // Récupération de l'ID du produit depuis l'URL
    const navigate = useNavigate();  // Hook pour la navigation programmatique

    // State pour les données du produit
    const [product, setProduct] = useState({
        name: "",
        description: "",
        price: "",
        quantity: "",
        image: ""
    });
    const [image, setImage] = useState(null);  // State pour la nouvelle image

    // Récupération des données du produit au chargement
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/api/products/${id}`);
                console.log('Fetched product data:', res.data);
                setProduct(res.data);  // Mise à jour du state avec les données du produit
            } catch (error) {
                console.error('Error fetching product:', error);
                toast.error('Failed to fetch product details.');
            }
        };
        fetchProduct();
    }, [id]);
    
    // Gestion du changement d'image
    const handleImageChange = (e) => {
        setImage(e.target.files[0]);  // Stockage du fichier image sélectionné
        console.log('Selected image:' + e.target.files[0]);
    };

    // Mise à jour du produit avec gestion d'image
    const handleUpdate = async (e) => {
        try {
            const formData = new FormData();  // FormData pour l'envoi de fichiers
            formData.append('name', product.name);
            formData.append('description', product.description);
            formData.append('price', product.price);
            formData.append('quantity', product.quantity);
            if (image) {
                formData.append('image', image);  // Ajout de la nouvelle image si sélectionnée
            }
            console.log(formData);

            // Requête PUT pour la mise à jour du produit
            await api.put(`/api/products/${id}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',  // Header pour l'upload de fichiers
                },
            });
            toast.success('Product updated successfully!');
            navigate('/api/products');  // Retour à la liste des produits
        } catch (error) {
            toast.error('Failed to update product.');
            console.error(error);
        }
    };

    // Suppression du produit
    const handleDelete = async () => {
        try {
            await api.delete(`/api/products/${id}`);
            toast.success('Product deleted successfully!');
            navigate('/api/products');  // Retour à la liste après suppression
        } catch (error) {
            toast.error('Failed to delete product.');
            console.error(error);
        }
    };
    
    return (
        <div className="admin-container">
            <h1>Modifier le produit</h1>
            <div className="edit-grid">
                {/* Section de prévisualisation du produit */}
                <div className="preview card">
                    {product.image ? (
                        <img src={product.image} alt={product.name} className="preview-img" />  
                    ) : (
                        <div className="preview-empty">Aucune image</div>  
                    )}
                    <div className="preview-meta">
                        <h3>{product.name}</h3>
                        <p className="small">Prix actuel: {product.price} XOF</p>
                        <p className="small">Quantité: {product.quantity}</p>
                    </div>
                </div>

                {/* Formulaire d'édition */}
                <div className="edit-form card">
                    <label>Nom du produit</label>
                    <input 
                        type="text" 
                        placeholder="Product Name"
                        value={product.name}
                        onChange={(e) => setProduct({ ...product, name: e.target.value })}  // Mise à jour du nom
                    />

                    <label>Prix</label>
                    <input 
                        type="number" 
                        placeholder="Price"
                        value={product.price}
                        onChange={(e) => setProduct({ ...product, price: e.target.value })}  // Mise à jour du prix
                    />

                    <label>Description</label>
                    <textarea 
                        placeholder="Description"
                        value={product.description}
                        onChange={(e) => setProduct({ ...product, description: e.target.value })}  // Mise à jour description
                    />

                    <label>Changer l'image</label>
                    <input type="file" name="image" accept="image/*" onChange={handleImageChange} />  {/* Input fichier image */}

                    {/* Actions du formulaire */}
                    <div className="form-actions">
                        <button onClick={handleUpdate} className="btn-primary">Mettre à jour</button>  {/* Bouton mise à jour */}
                        <button onClick={handleDelete} className="btn-danger">Supprimer</button>  {/* Bouton suppression */}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminProductEdit;