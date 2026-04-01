import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';
import axios from 'axios';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import WishlistPage from './pages/WishlistPage';
import BlogsPage from './pages/BlogsPage';
import AdminPanel from './pages/AdminPanel';
import './App.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function App() {
  const [cart, setCart] = useState({ items: [], total: 0 });

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const { data } = await axios.get(`${API}/cart`, { withCredentials: true });
      setCart(data);
    } catch (error) {
      // Not logged in
    }
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App bg-luxury-bg min-h-screen">
          <Navbar cart={cart} />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/products" element={<ProductListingPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/blogs" element={<BlogsPage />} />
            
            <Route path="/cart" element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/wishlist" element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute adminOnly={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
          </Routes>
          <Footer />
          <Toaster position="top-right" theme="dark" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
