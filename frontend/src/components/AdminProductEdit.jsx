import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import '../styles/AdminProducts.css';

const AdminProductEdit = () => {
    const {id} = useParams();
    const navigate = useNavigate(); 

    const [product, setProduct] = useState({
        name: "",
        description: "",
        price: "",
        quantity: "",
        image: ""
    });
    const [image, setImage] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/api/products/${id}`);
                console.log('Fetched product data:', res.data);
                setProduct(res.data);
            } catch (error) {
                console.error('Error fetching product:', error);
                toast.error('Failed to fetch product details.');
            }
        };
        fetchProduct();
    }, [id]);
    
    // handle file input image
    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
        console.log('Selected image:' + e.target.files[0]);
    };

    //handle product update, with include image update
    const handleUpdate = async (e) => {
        try {
            const formData = new FormData();
            formData.append('name', product.name);
            formData.append('description', product.description);
            formData.append('price', product.price);
            formData.append('quantity', product.quantity);
            if (image) {
                formData.append('image', image);
            }
            console.log(formData);

            await api.put(`/api/products/${id}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Product updated successfully!');
            navigate('/api/products');
        } catch (error) {
            toast.error('Failed to update product.');
            console.error(error);
        }
    };


    const handleDelete = async () => {
        try {
            await api.delete(`/api/products/${id}`);
            toast.success('Product deleted successfully!');
            navigate('/api/products');
        } catch (error) {
            toast.error('Failed to delete product.');
            console.error(error);
        }
    };
    
    return (
        <div className="admin-container">
            <h1>Modifier le produit</h1>
            <div className="edit-grid">
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

                <div className="edit-form card">
                    <label>Nom du produit</label>
                    <input 
                        type="text" 
                        placeholder="Product Name"
                        value={product.name}
                        onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    />

                    <label>Prix</label>
                    <input 
                        type="number" 
                        placeholder="Price"
                        value={product.price}
                        onChange={(e) => setProduct({ ...product, price: e.target.value })}
                    />

                    <label>Description</label>
                    <textarea 
                        placeholder="Description"
                        value={product.description}
                        onChange={(e) => setProduct({ ...product, description: e.target.value })}
                    />

                    <label>Changer l'image</label>
                    <input type="file" name="image" accept="image/*" onChange={handleImageChange} />

                    <div className="form-actions">
                        <button onClick={handleUpdate} className="btn-primary">Mettre à jour</button>
                        <button onClick={handleDelete} className="btn-danger">Supprimer</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminProductEdit;