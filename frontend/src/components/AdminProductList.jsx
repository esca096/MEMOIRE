// for listing products and adding products

import React, { useEffect, useState } from 'react';
import api from '../api';
import { ACCESS_TOKEN } from '../token';
import '../styles/AdminProducts.css';
import {toast} from 'react-toastify';
import { useNavigate } from 'react-router-dom';


const AdminProductList = () => {
    const [products, setProducts] = useState([]);
    const [newProduct, setNewProduct] = useState({ name: "", description: "", price: "", quantity: "" });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // fetch existing products
    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem(ACCESS_TOKEN);
            console.log('Access Token Available:', token); // Log the access token for debugging
            if (!token) {
                throw new Error('No access token found');
            }
            const res = await api.get('/api/products/', {
                headers: { Authorization: `Bearer ${token}` },
            })
            console.log('Fetched products:', res.data); // Log the fetched products for debugging
            // The API may return either a plain array or a paginated object { count, next, results }
            const fetched = res.data;
            if (Array.isArray(fetched)) {
                setProducts(fetched);
            } else if (fetched && Array.isArray(fetched.results)) {
                setProducts(fetched.results);
            } else {
                // Fallback to empty array to avoid "not iterable" errors
                setProducts([]);
            }
        } catch (error) {
            console.error('Error getting products:', error);
            setError(error);
            toast.error('Failed to fetch products.');
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);


    // handle change for input products form
    const handleInputChange = (e) => {
        setNewProduct({...newProduct, [e.target.name]: e.target.value });
    };

    // handle image upload
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImage(file);
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImagePreview(null);
        }
    };

    // handle form submission to add new product with image
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem(ACCESS_TOKEN);
            if (!token) {
                throw new Error('No access token found');
            }
            // get the from data to include in the request
            const formData = new FormData();
            formData.append('name', newProduct.name);
            formData.append('description', newProduct.description);
            formData.append('price', newProduct.price);
            formData.append('quantity', newProduct.quantity);
            if (image) {
                formData.append('image', image);
            }

            const res = await api.post('/api/products/', formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Create product response:', res);
            // If API returned the created product object, append it. Otherwise refresh the list from server.
            if (res && res.data && res.data.id) {
                setProducts(prev => Array.isArray(prev) ? [...prev, res.data] : [res.data]);
            } else {
                // If server returns no body (or different shape), re-fetch the products to reflect DB
                await fetchProducts();
            }
            setNewProduct({ name: "", description: "", price: "", quantity: "" }); // reset form
            setImage(null);
            setImagePreview(null);
            toast.success('Product added successfully!');
        } catch (error) {
            console.error('Error adding product:', error);
            setError('Failed to add product.');
            toast.error('Failed to add product.');
        }
    };

    const handleDeleteProduct = async (id) => {
        const ok = window.confirm('Confirmer la suppression de ce produit ?');
        if (!ok) return;
        try {
            const token = localStorage.getItem(ACCESS_TOKEN);
            if (!token) throw new Error('No access token');
            // ensure trailing slash for Django endpoint
            await api.delete(`/api/products/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Produit supprimé');
            await fetchProducts();
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
                                        <button type="button" onClick={() => navigate(`/api/products/${product.id}`)} className="btn-small">Éditer</button>
                                        <button type="button" onClick={() => handleDeleteProduct(product.id)} className="btn-small danger">Supprimer</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>Aucun produit trouvé.</p>
                        )}
                    </div>
                </div>

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
                        <input type="file" name="image" accept="image/*" onChange={handleImageChange} />
                        {imagePreview && (
                            <div className="preview-box">
                                <img src={imagePreview} alt="preview" />
                            </div>
                        )}

                        <div style={{marginTop:12}}>
                            <button type="submit" className="btn-primary">Ajouter produit</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
export default AdminProductList;