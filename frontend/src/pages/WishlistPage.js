import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const { data } = await axios.get(`${API}/wishlist`, { withCredentials: true });
      setWishlist(data.items || []);
    } catch (error) {
      console.error('Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-luxury-bg pt-32 px-6 flex items-center justify-center">
      <p className="text-luxury-muted">Loading...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-luxury-bg pt-32 px-6 pb-16">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-heading text-4xl font-light text-luxury-text mb-12" data-testid="wishlist-title">My Wishlist</h1>

        {wishlist.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-luxury-muted">Your wishlist is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} onWishlistToggle={fetchWishlist} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
