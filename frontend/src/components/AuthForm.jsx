import api from "../api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../token";
import "../styles/AuthForm.css";
import google from "../assets/google.png";


const AuthForm = ({ route, method}) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await api.post(route, {
                username,
                password,
            });

            if (method === "login") {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                navigate("/dashboard");
                window.location.reload();
            } else {
                setSuccess("Registration successful! You can now log in.");
                setTimeout(() => {
                    navigate("/login");
                }, 2000)
                    
            }
        }   catch (error) {
                console.error(error);
                if (error.response) {
                    if (error.response.status === 401) {
                        setError("Invalid crudentials");
                    } else if (error.response.status === 400) {
                        setError("Username already exists");
                    }else {
                        setError("Something went wrong. Please try again.");
                    }
                }else if (error.request) {
                    setError("Network error. Please check your connection.");
                }else {
                    setError("Something went wrong. Please try again.");
                }
        }   finally {
            setLoading(false);
        }
       
    };

    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8000/accounts/google/login/";
    };

    return (
        <div className="form-container">
            {loading && (
                <div className="loading-indicator">
                    {error ? <span className="error-message">{error}</span> : <div className="spinner"></div>}
                </div>
            )}
            {!loading &&(
                <form onSubmit={handleSubmit} className="form">
                    <h2>{method === 'register' ? "Inscription" : "Connexion"}</h2>
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}
                    <div className="form-group">
                        <label htmlFor="username">Nom d'utilisateur:</label>
                        <input 
                            type="text" 
                            id="username" 
                            value={username} onChange={e => setUsername(e.target.value)} 
                            required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="username">Mot de passe:</label>
                        <input 
                            type="password" 
                            id="password" 
                            value={password} onChange={e => setPassword(e.target.value)} 
                            required />
                    </div>
                    <button type="submit" className="form-button">
                        {method === 'register' ? "S'inscrire" : "Se connecter"}
                    </button>
                    <button type="button" className="google-button" onClick={handleGoogleLogin}>
                        <img src={google} alt="Google icon" className="google-icon" />
                        {method === 'register' ? "S'inscrire avec Google" : "Se connecter avec Google"}
                    </button>
                    {method === 'login' && (
                        <p className="toggle-text">Vous n&apos;avez pas de compte ? 
                            <span className="toggle-link" onClick={() => navigate("/register")}>S'inscrire</span>
                        </p>
                    )}
                    {method === 'register' && (
                        <p className="toggle-text">Vous avez déjà un compte ? 
                            <span className="toggle-link" onClick={() => navigate("/login")}>Se connecter</span>
                        </p>
                    )}
                </form>
            )}
        </div>
    );
}

export default AuthForm;