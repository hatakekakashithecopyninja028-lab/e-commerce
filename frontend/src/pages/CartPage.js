import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import api from '../lib/api';

const CartPage = () => {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      await api.put(`/cart/${productId}`, null, { params: { quantity } });
      fetchCart();
    } catch (error) {
      toast.error('Failed to update cart');
    }
  };

  const removeItem = async (productId) => {
    try {
      await api.delete(`/cart/${productId}`);
      toast.success('Item removed');
      fetchCart();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-luxury-bg pt-32 px-6 flex items-center justify-center">
      <p className="text-luxury-muted">Loading cart...</p>
    </div>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-luxury-bg pt-32 px-6">
        <div className="max-w-2xl mx-auto text-center py-20">
          <h1 className="font-heading text-4xl font-light text-luxury-text mb-4">Your Cart is Empty</h1>
          <p className="text-luxury-muted mb-8">Discover our luxury fragrances</p>
          <Link to="/products">
            <button className="btn-primary">Shop Now</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-bg pt-32 px-6 pb-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-heading text-4xl font-light text-luxury-text mb-12" data-testid="cart-title">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item.product_id} className="glass-card p-6" data-testid={`cart-item-${item.product_id}`}>
                <div className="flex gap-6">
                  <img
                    src={item.product?.images?.[0] || 'https://images.pexels.com/photos/7702669/pexels-photo-7702669.jpeg'}
                    alt={item.product?.name}
                    className="w-24 h-24 object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-luxury-text text-lg font-light mb-1">{item.product?.name}</h3>
                    <p className="text-luxury-gold text-sm mb-4">{item.product?.brand}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="w-8 h-8 border border-luxury-border text-luxury-text hover:bg-luxury-gold hover:text-black transition-colors"
                          data-testid={`decrease-qty-${item.product_id}`}
                        >
                          -
                        </button>
                        <span className="text-luxury-text w-8 text-center" data-testid={`qty-${item.product_id}`}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="w-8 h-8 border border-luxury-border text-luxury-text hover:bg-luxury-gold hover:text-black transition-colors"
                          data-testid={`increase-qty-${item.product_id}`}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-luxury-text">₹{item.item_total?.toFixed(0)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.product_id)}
                    className="text-luxury-muted hover:text-luxury-gold transition-colors"
                    data-testid={`remove-item-${item.product_id}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card p-6 h-fit sticky top-32">
            <h2 className="text-luxury-text text-xl font-light mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-luxury-muted">
                <span>Subtotal</span>
                <span data-testid="cart-subtotal">₹{cart.total?.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-luxury-muted">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t border-luxury-border pt-4 flex justify-between text-luxury-text text-xl font-medium">
                <span>Total</span>
                <span data-testid="cart-total">₹{cart.total?.toFixed(0)}</span>
              </div>
            </div>
            <Link to="/checkout">
              <button className="w-full btn-primary" data-testid="checkout-btn">
                Proceed to Checkout
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
