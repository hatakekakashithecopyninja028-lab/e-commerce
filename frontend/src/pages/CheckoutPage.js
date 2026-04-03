import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { toast } from 'sonner';

const CheckoutPage = () => {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [address, setAddress] = useState({
    full_name: '', phone: '', address_line1: '', address_line2: '',
    city: '', state: '', pincode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch (error) {
      navigate('/login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/orders', {
        address,
        payment_method: paymentMethod
      });

      if (paymentMethod === 'razorpay') {
        const options = {
          key: 'rzp_test_SYFRK4IwukAGQI',
          amount: data.amount * 100,
          currency: 'INR',
          order_id: data.razorpay_order_id,
          handler: async (response) => {
            try {
              await api.post(`/orders/${data.order_id}/verify-payment`, {}, { 
                params: { 
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature 
                } 
              });
              toast.success('Payment successful!');
              navigate('/orders');
            } catch (error) {
              toast.error('Payment verification failed');
            }
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.success('Order placed successfully!');
        navigate('/orders');
      }
    } catch (error) {
      toast.error('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-bg pt-32 px-6 pb-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-4xl font-light text-luxury-text mb-12" data-testid="checkout-title">Checkout</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="glass-card p-8">
            <h2 className="text-luxury-text text-2xl font-light mb-6">Delivery Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Full Name"
                value={address.full_name}
                onChange={(e) => setAddress({...address, full_name: e.target.value})}
                className="w-full bg-transparent border-b border-luxury-border focus:border-luxury-gold text-luxury-text px-0 py-3 outline-none"
                required
                data-testid="address-name"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={address.phone}
                onChange={(e) => setAddress({...address, phone: e.target.value})}
                className="w-full bg-transparent border-b border-luxury-border focus:border-luxury-gold text-luxury-text px-0 py-3 outline-none"
                required
                data-testid="address-phone"
              />
              <input
                type="text"
                placeholder="Address Line 1"
                value={address.address_line1}
                onChange={(e) => setAddress({...address, address_line1: e.target.value})}
                className="md:col-span-2 w-full bg-transparent border-b border-luxury-border focus:border-luxury-gold text-luxury-text px-0 py-3 outline-none"
                required
                data-testid="address-line1"
              />
              <input
                type="text"
                placeholder="Address Line 2"
                value={address.address_line2}
                onChange={(e) => setAddress({...address, address_line2: e.target.value})}
                className="md:col-span-2 w-full bg-transparent border-b border-luxury-border focus:border-luxury-gold text-luxury-text px-0 py-3 outline-none"
                data-testid="address-line2"
              />
              <input
                type="text"
                placeholder="City"
                value={address.city}
                onChange={(e) => setAddress({...address, city: e.target.value})}
                className="w-full bg-transparent border-b border-luxury-border focus:border-luxury-gold text-luxury-text px-0 py-3 outline-none"
                required
                data-testid="address-city"
              />
              <input
                type="text"
                placeholder="State"
                value={address.state}
                onChange={(e) => setAddress({...address, state: e.target.value})}
                className="w-full bg-transparent border-b border-luxury-border focus:border-luxury-gold text-luxury-text px-0 py-3 outline-none"
                required
                data-testid="address-state"
              />
              <input
                type="text"
                placeholder="Pincode"
                value={address.pincode}
                onChange={(e) => setAddress({...address, pincode: e.target.value})}
                className="w-full bg-transparent border-b border-luxury-border focus:border-luxury-gold text-luxury-text px-0 py-3 outline-none"
                required
                data-testid="address-pincode"
              />
            </div>
          </div>

          <div className="glass-card p-8">
            <h2 className="text-luxury-text text-2xl font-light mb-6">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="accent-luxury-gold"
                  data-testid="payment-razorpay"
                />
                <span className="text-luxury-text">Razorpay (Credit/Debit/UPI)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="accent-luxury-gold"
                  data-testid="payment-cod"
                />
                <span className="text-luxury-text">Cash on Delivery</span>
              </label>
            </div>
          </div>

          <div className="glass-card p-8">
            <h2 className="text-luxury-text text-2xl font-light mb-6">Order Summary</h2>
            <div className="space-y-3 mb-6">
              {cart.items.map((item) => (
                <div key={item.product_id} className="flex justify-between text-luxury-muted">
                  <span>{item.product?.name} x {item.quantity}</span>
                  <span>₹{item.item_total?.toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-luxury-border pt-4 flex justify-between text-luxury-text text-2xl">
              <span>Total</span>
              <span data-testid="order-total">₹{cart.total?.toFixed(0)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || cart.items.length === 0}
            className="w-full btn-primary disabled:opacity-50"
            data-testid="place-order-btn"
          >
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
