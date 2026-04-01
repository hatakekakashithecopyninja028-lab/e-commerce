import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminPanel = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '', brand: '', price: '', discount: '', description: '',
    gender: 'Men', mood: [], season: [], notes: { top: '', middle: '', base: '' }, stock: 100
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        axios.get(`${API}/products?limit=100`),
        axios.get(`${API}/admin/orders`, { withCredentials: true }),
        axios.get(`${API}/admin/users`, { withCredentials: true })
      ]);
      setProducts(productsRes.data.products || []);
      setOrders(ordersRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Failed to fetch admin data');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        discount: parseFloat(newProduct.discount),
        images: ['https://images.pexels.com/photos/7702669/pexels-photo-7702669.jpeg']
      };
      await axios.post(`${API}/admin/products`, productData, { withCredentials: true });
      toast.success('Product created!');
      fetchData();
      setNewProduct({
        name: '', brand: '', price: '', discount: '', description: '',
        gender: 'Men', mood: [], season: [], notes: { top: '', middle: '', base: '' }, stock: 100
      });
    } catch (error) {
      toast.error('Failed to create product');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await axios.delete(`${API}/admin/products/${id}`, { withCredentials: true });
      toast.success('Product deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      await axios.put(`${API}/admin/orders/${id}?order_status=${status}`, {}, { withCredentials: true });
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  return (
    <div className="min-h-screen bg-luxury-bg pt-32 px-6 pb-16">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-heading text-4xl font-light text-luxury-text mb-12" data-testid="admin-title">Admin Panel</h1>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="glass-card p-1 mb-8">
            <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-card p-8">
                <h2 className="text-luxury-text text-2xl font-light mb-6">Add New Product</h2>
                <form onSubmit={handleCreateProduct} className="space-y-4" data-testid="add-product-form">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full bg-transparent border-b border-luxury-border text-luxury-text px-0 py-2 outline-none"
                    required
                    data-testid="product-name-input"
                  />
                  <input
                    type="text"
                    placeholder="Brand"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                    className="w-full bg-transparent border-b border-luxury-border text-luxury-text px-0 py-2 outline-none"
                    required
                    data-testid="product-brand-input"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Price"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      className="w-full bg-transparent border-b border-luxury-border text-luxury-text px-0 py-2 outline-none"
                      required
                      data-testid="product-price-input"
                    />
                    <input
                      type="number"
                      placeholder="Discount %"
                      value={newProduct.discount}
                      onChange={(e) => setNewProduct({...newProduct, discount: e.target.value})}
                      className="w-full bg-transparent border-b border-luxury-border text-luxury-text px-0 py-2 outline-none"
                      data-testid="product-discount-input"
                    />
                  </div>
                  <textarea
                    placeholder="Description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full bg-transparent border border-luxury-border text-luxury-text px-3 py-2 outline-none"
                    rows="3"
                    required
                    data-testid="product-description-input"
                  />
                  <select
                    value={newProduct.gender}
                    onChange={(e) => setNewProduct({...newProduct, gender: e.target.value})}
                    className="w-full bg-luxury-surface border border-luxury-border text-luxury-text px-3 py-2"
                    data-testid="product-gender-input"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                  <button type="submit" className="w-full btn-primary" data-testid="create-product-btn">
                    Create Product
                  </button>
                </form>
              </div>

              <div className="glass-card p-8">
                <h2 className="text-luxury-text text-2xl font-light mb-6">Products ({products.length})</h2>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {products.map((product) => (
                    <div key={product.id} className="flex justify-between items-start p-4 border border-luxury-border" data-testid={`product-item-${product.id}`}>
                      <div>
                        <h3 className="text-luxury-text font-light">{product.name}</h3>
                        <p className="text-luxury-muted text-sm">₹{product.price} | Stock: {product.stock}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-500 text-sm hover:text-red-400"
                        data-testid={`delete-product-${product.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="glass-card p-8">
              <h2 className="text-luxury-text text-2xl font-light mb-6">Orders ({orders.length})</h2>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-luxury-border p-6" data-testid={`order-item-${order.id}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-luxury-text">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-luxury-muted text-sm">{order.user_email}</p>
                        <p className="text-luxury-gold">₹{order.total?.toFixed(0)}</p>
                      </div>
                      <select
                        value={order.order_status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="bg-luxury-surface border border-luxury-border text-luxury-text px-3 py-1 text-sm"
                        data-testid={`order-status-${order.id}`}
                      >
                        <option value="placed">Placed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="text-luxury-muted text-sm">
                      {order.items?.map((item, i) => (
                        <p key={i}>{item.product_name} x {item.quantity}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="glass-card p-8">
              <h2 className="text-luxury-text text-2xl font-light mb-6">Users ({users.length})</h2>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.email} className="flex justify-between items-center border border-luxury-border p-4" data-testid={`user-item-${user.email}`}>
                    <div>
                      <p className="text-luxury-text">{user.name}</p>
                      <p className="text-luxury-muted text-sm">{user.email}</p>
                    </div>
                    <span className="text-luxury-gold text-xs uppercase">{user.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
