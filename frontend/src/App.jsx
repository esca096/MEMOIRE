import Ract from "react"
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
  const ProtectedLogin = () => {
    return isAuthorized ? <Navigate to='/dashboard' /> : <AuthPage initialMethod='login' />
  }
  const ProtectedRegister = () => {
    return isAuthorized ? <Navigate to='/' /> : <AuthPage initialMethod='register' />
  }

  return (
    <div className="app-root">
      <BrowserRouter>
        <Navbar />
        <ToastContainer /> {/* ToastContainer is used to display toast notifications */}
        <main className="main-content">
          <Routes>
          <Route path="/login/callback" element={<RedirectGoogleAuth />} />
          <Route path="/login" element={<ProtectedLogin />} />
          <Route path="/register" element={<ProtectedRegister />} />
          <Route path="/dashboard" element={isAuthorized? <Dashboard /> : <Navigate to='/login' />} />
          <Route path="/api/products" element={<AdminProductList />} />
          <Route path="/api/products/:id" element={<AdminProductEdit />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/why" element={<Why />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={isAuthorized? <Cart /> : <Navigate to='/login' />} />
          <Route path="/checkout" element={isAuthorized? <Checkout /> : <Navigate to='/login' />} />
          <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
          <Route path="/reviews/:id" element={<ReviewForm />} />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound/>} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </div>
  )
}

export default App
