import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ProductCard from '../components/ProductCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
    fetchSimilar();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await axios.get(`${API}/products/${id}`);
      setProduct(data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilar = async () => {
    try {
      const { data } = await axios.get(`${API}/products/${id}/similar`);
      setSimilar(data);
    } catch (error) {
      console.error('Failed to fetch similar products');
    }
  };

  const handleAddToCart = async () => {
    try {
      await axios.post(`${API}/cart`, { product_id: id, quantity: 1 }, { withCredentials: true });
      toast.success('Added to cart!');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Please login to add items');
      } else {
        toast.error('Failed to add to cart');
      }
    }
  };

  if (loading || !product) {
    return <div className="min-h-screen bg-luxury-bg pt-32 px-6 flex items-center justify-center">
      <p className="text-luxury-muted">Loading...</p>
    </div>;
  }

  const discountedPrice = product.price * (1 - (product.discount || 0) / 100);

  return (
    <div className="min-h-screen bg-luxury-bg pt-32 px-6 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-card overflow-hidden"
          >
            <img
              src={product.images?.[0] || 'https://images.pexels.com/photos/7702669/pexels-photo-7702669.jpeg'}
              alt={product.name}
              className="w-full h-full object-cover"
              data-testid="product-image"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <p className="text-luxury-gold text-xs tracking-[0.3em] uppercase">{product.brand}</p>
            <h1 className="font-heading text-5xl font-light text-luxury-text" data-testid="product-name">{product.name}</h1>
            
            <div className="flex items-center gap-4">
              {product.discount > 0 ? (
                <>
                  <span className="text-luxury-text text-3xl font-light" data-testid="product-price">₹{discountedPrice.toFixed(0)}</span>
                  <span className="text-luxury-muted text-xl line-through">₹{product.price}</span>
                  <span className="bg-luxury-gold text-black px-3 py-1 text-sm">-{product.discount}%</span>
                </>
              ) : (
                <span className="text-luxury-text text-3xl font-light">₹{product.price}</span>
              )}
            </div>

            {product.average_rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < product.average_rating ? 'fill-luxury-gold text-luxury-gold' : 'text-luxury-muted'}`} />
                  ))}
                </div>
                <span className="text-luxury-muted text-sm">({product.reviews?.length} reviews)</span>
              </div>
            )}

            <p className="text-luxury-muted leading-relaxed" data-testid="product-description">{product.description}</p>

            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {product.mood?.map((m) => (
                  <span key={m} className="bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 px-3 py-1 text-xs tracking-wider uppercase">
                    {m}
                  </span>
                ))}
              </div>

              <div>
                <h3 className="text-luxury-text text-sm mb-2 tracking-wider uppercase">Fragrance Notes</h3>
                <div className="space-y-2 text-luxury-muted text-sm">
                  <p><span className="text-luxury-gold">Top:</span> {product.notes?.top}</p>
                  <p><span className="text-luxury-gold">Middle:</span> {product.notes?.middle}</p>
                  <p><span className="text-luxury-gold">Base:</span> {product.notes?.base}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button onClick={handleAddToCart} className="flex-1 btn-primary" data-testid="add-to-cart-btn">
                <ShoppingCart className="w-5 h-5 inline mr-2" />
                Add to Cart
              </button>
              <button className="btn-outline px-6" data-testid="wishlist-btn">
                <Heart className="w-5 h-5" />
              </button>
            </div>

            {product.stock < 10 && (
              <p className="text-luxury-gold text-sm">Only {product.stock} left in stock!</p>
            )}
          </motion.div>
        </div>

        {similar.length > 0 && (
          <section>
            <h2 className="font-heading text-3xl font-light text-luxury-text mb-8">Similar Fragrances</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {similar.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {product.reviews && product.reviews.length > 0 && (
          <section className="mt-32">
            <h2 className="font-heading text-3xl font-light text-luxury-text mb-8">Customer Reviews</h2>
            <div className="space-y-4">
              {product.reviews.map((review) => (
                <div key={review.id} className="glass-card p-6">
                  <div className="flex items-center gap-4 mb-3">
                    <p className="text-luxury-text font-medium">{review.user_name}</p>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-luxury-gold text-luxury-gold' : 'text-luxury-muted'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-luxury-muted">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
