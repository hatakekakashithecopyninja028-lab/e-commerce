import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(`${API}/orders`, { withCredentials: true });
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-luxury-bg pt-32 px-6 flex items-center justify-center">
      <p className="text-luxury-muted">Loading orders...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-luxury-bg pt-32 px-6 pb-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-heading text-4xl font-light text-luxury-text mb-12" data-testid="orders-title">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-luxury-muted">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="glass-card p-6"
                data-testid={`order-${order.id}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-luxury-muted text-sm">Order ID: {order.id}</p>
                    <p className="text-luxury-text text-lg font-light mt-1">₹{order.total?.toFixed(0)}</p>
                  </div>
                  <span className="bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 px-3 py-1 text-xs uppercase">
                    {order.order_status}
                  </span>
                </div>

                <div className="space-y-2">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-luxury-muted text-sm">
                      <span>{item.product_name} x {item.quantity}</span>
                      <span>₹{item.total?.toFixed(0)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-luxury-border">
                  <p className="text-luxury-muted text-sm">
                    Delivery: {order.address?.address_line1}, {order.address?.city}, {order.address?.state}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
