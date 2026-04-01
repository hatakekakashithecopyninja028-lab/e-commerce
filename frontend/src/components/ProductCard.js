import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProductCard = ({ product, onWishlistToggle }) => {
  const [isInWishlist, setIsInWishlist] = useState(false);

  const discountedPrice = product.price * (1 - (product.discount || 0) / 100);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/cart`, { product_id: product.id, quantity: 1 }, { withCredentials: true });
      toast.success('Added to cart!');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Please login to add items to cart');
      } else {
        toast.error('Failed to add to cart');
      }
    }
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    try {
      if (isInWishlist) {
        await axios.delete(`${API}/wishlist/${product.id}`, { withCredentials: true });
        setIsInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await axios.post(`${API}/wishlist/${product.id}`, {}, { withCredentials: true });
        setIsInWishlist(true);
        toast.success('Added to wishlist');
      }
      if (onWishlistToggle) onWishlistToggle();
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Please login to manage wishlist');
      } else {
        toast.error('Failed to update wishlist');
      }
    }
  };

  return (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 40 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="group"
      data-testid={`product-card-${product.id}`}
    >
      <Link to={`/products/${product.id}`}>
        <div className="glass-card overflow-hidden relative">
          <div className="relative overflow-hidden aspect-[3/4]">
            <img
              src={product.images?.[0] || 'https://images.pexels.com/photos/7702669/pexels-photo-7702669.jpeg'}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-2 group-hover:rotate-1"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {product.discount > 0 && (
              <div className="absolute top-4 right-4 bg-luxury-gold text-black px-3 py-1 text-xs tracking-wider font-medium">
                -{product.discount}%
              </div>
            )}

            <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-luxury-gold text-black py-2 text-sm font-medium tracking-wider hover:bg-white transition-colors"
                data-testid={`add-to-cart-${product.id}`}
              >
                <ShoppingCart className="w-4 h-4 inline mr-2" />
                ADD
              </button>
              <button
                onClick={handleWishlistToggle}
                className={`${isInWishlist ? 'bg-luxury-gold text-black' : 'bg-luxury-surface text-luxury-gold'} border border-luxury-border px-3 hover:bg-luxury-gold hover:text-black transition-colors`}
                data-testid={`wishlist-toggle-${product.id}`}
              >
                <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-6">
            <p className="text-luxury-gold text-xs tracking-[0.2em] uppercase mb-2">{product.brand}</p>
            <h3 className="font-heading text-xl font-light text-luxury-text mb-3">{product.name}</h3>
            
            <div className="flex items-center gap-2 mb-3">
              {product.mood?.slice(0, 2).map((m) => (
                <span key={m} className="bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 px-2 py-1 text-xs tracking-wider uppercase">
                  {m}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {product.discount > 0 ? (
                <>
                  <span className="text-luxury-text text-lg font-medium">₹{discountedPrice.toFixed(0)}</span>
                  <span className="text-luxury-muted text-sm line-through">₹{product.price}</span>
                </>
              ) : (
                <span className="text-luxury-text text-lg font-medium">₹{product.price}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
