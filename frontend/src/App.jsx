/**
 * Fichier: App.jsx (Composant racine React)
 * 
 * Description (FR):
 * - Composant principal qui définit la structure de l'application React
 * - Configure le routage avec React Router DOM
 * - Gère la logique de protection des routes selon l'authentification
 * - Définit l'architecture globale de l'application
 * 
 * Structure principale :
 * - Router BrowserRouter pour la navigation SPA
 * - Routes protégées et publiques
 * - Layout commun avec Navbar et Footer
 * - Système de notifications Toast
 * 
 * Connexions :
 * - Intègre tous les composants de pages et fonctionnalités
 * - Utilise le hook d'authentification pour la protection des routes
 * - Coordonne la navigation entre toutes les sections de l'application
 */

import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Navbar from "./components/Navbar"
import NotFound from "./pages/NotFound"
import Home from "./pages/Home"
import AuthPage from "./pages/AuthPage"
import { useAuthentication } from "./auth"
import RedirectGoogleAuth from "./components/GoogleRedirectHandler"
import Dashboard from "./components/Dashboard"
import AdminProductList from "./components/AdminProductList"
import { ToastContainer } from "react-toastify"
import AdminProductEdit from "./components/AdminProductEdit"
import Cart from "./components/Cart"
import Checkout from "./components/Checkout"
import OrderConfirmation from "./components/OrderConformation"
import ReviewForm from "./components/ReviewForm"
import ProductDetail from "./components/ProductDetail"
import Why from "./pages/Why"
import About from "./pages/About"
import Contact from "./pages/Contact"
import Footer from "./components/Footer"

function App() {
  
  const { isAuthorized } = useAuthentication()
  
  // Composants pour les routes protégées de connexion
  const ProtectedLogin = () => {
    return isAuthorized ? <Navigate to='/dashboard' /> : <AuthPage initialMethod='login' />
  }
  const ProtectedRegister = () => {
    return isAuthorized ? <Navigate to='/' /> : <AuthPage initialMethod='register' />
  }

  return (
    <div className="app-root">
      <BrowserRouter>  {/* Fournit le contexte de routage */}
        <Navbar />  {/* Barre de navigation présente sur toutes les pages */}
        <ToastContainer /> {/* Container pour les notifications toast */}
        <main className="main-content">  {/* Contenu principal de l'application */}
          <Routes>
            {/* Routes d'authentification et callback OAuth */}
            <Route path="/login/callback" element={<RedirectGoogleAuth />} />  {/* Callback Google OAuth */}
            <Route path="/login" element={<ProtectedLogin />} />  {/* Page de connexion protégée */}
            <Route path="/register" element={<ProtectedRegister />} />  {/* Page d'inscription protégée */}
            
            {/* Routes protégées par authentification */}
            <Route path="/dashboard" element={isAuthorized? <Dashboard /> : <Navigate to='/login' />} />  {/* Tableau de bord utilisateur */}
            <Route path="/api/products" element={<AdminProductList />} />  {/* Liste des produits (admin) */}
            <Route path="/api/products/:id" element={<AdminProductEdit />} />  {/* Édition produit (admin) */}
            <Route path="/cart" element={isAuthorized? <Cart /> : <Navigate to='/login' />} />  {/* Panier d'achat */}
            <Route path="/checkout" element={isAuthorized? <Checkout /> : <Navigate to='/login' />} />  {/* Paiement */}
            
            {/* Routes publiques */}
            <Route path="/product/:id" element={<ProductDetail />} />  {/* Détail d'un produit */}
            <Route path="/why" element={<Why />} />  {/* Page "Pourquoi nous choisir" */}
            <Route path="/about" element={<About />} />  {/* Page "À propos" */}
            <Route path="/contact" element={<Contact />} />  {/* Page de contact */}
            <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />  {/* Confirmation de commande */}
            <Route path="/reviews/:id" element={<ReviewForm />} />  {/* Formulaire d'avis */}
            <Route path="/" element={<Home />} />  {/* Page d'accueil */}
            <Route path="*" element={<NotFound/>} />  {/* Route 404 - page non trouvée */}
          </Routes>
        </main>
        <Footer />  {/* Pied de page présent sur toutes les pages */}
      </BrowserRouter>
    </div>
  )
}

export default App