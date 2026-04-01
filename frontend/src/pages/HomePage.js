import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Star } from 'lucide-react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data } = await axios.get(`${API}/products?limit=8`);
      setFeaturedProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const categories = [
    { name: 'Men', image: 'https://images.pexels.com/photos/3997016/pexels-photo-3997016.jpeg', link: '/products?gender=Men' },
    { name: 'Women', image: 'https://images.unsplash.com/photo-1762635696772-0ed637b1a3a7', link: '/products?gender=Women' },
    { name: 'Unisex', image: 'https://images.unsplash.com/photo-1774682060959-efe13b7a12b9', link: '/products?gender=Unisex' }
  ];

  const moods = [
    { name: 'Office', icon: '💼', link: '/products?mood=Office' },
    { name: 'Party', icon: '🎉', link: '/products?mood=Party' },
    { name: 'Daily', icon: '☀️', link: '/products?mood=Daily' },
    { name: 'Gym', icon: '💪', link: '/products?mood=Gym' }
  ];

  const notes = [
    { name: 'Woody', link: '/products?note=Woody' },
    { name: 'Floral', link: '/products?note=Floral' },
    { name: 'Fresh', link: '/products?note=Fresh' },
    { name: 'Oud', link: '/products?note=Oud' }
  ];

  return (
    <div className="bg-luxury-bg">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1732046827794-ac0d6c915a4a"
            alt="Luxury Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-bg via-black/60 to-black/40" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center px-6 max-w-4xl"
        >
          <p className="text-luxury-gold text-sm tracking-[0.3em] uppercase mb-6">Discover Your Signature Scent</p>
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-white mb-8">
            Timeless Elegance<br />in Every Drop
          </h1>
          <p className="text-luxury-muted text-lg md:text-xl font-light leading-relaxed mb-12 max-w-2xl mx-auto">
            Curated collection of the world's finest fragrances. Experience luxury that lingers.
          </p>
          <Link to="/products">
            <button className="btn-primary" data-testid="hero-shop-btn">
              Explore Collection
            </button>
          </Link>
        </motion.div>
      </section>

      {/* Shop by Gender */}
      <section className="py-32 px-6" data-testid="gender-section">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-luxury-gold text-xs tracking-[0.3em] uppercase mb-4">Collections</p>
            <h2 className="font-heading text-4xl md:text-5xl font-light text-white">Shop by Gender</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Link to={cat.link} data-testid={`gender-${cat.name.toLowerCase()}`}>
                  <div className="glass-card overflow-hidden group">
                    <div className="relative h-96 overflow-hidden">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-8 left-8">
                        <h3 className="font-heading text-3xl font-light text-white mb-2">{cat.name}</h3>
                        <span className="text-luxury-gold text-sm tracking-wider flex items-center">
                          EXPLORE <ChevronRight className="w-4 h-4 ml-2" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-32 px-6 bg-luxury-surface" data-testid="featured-section">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-luxury-gold text-xs tracking-[0.3em] uppercase mb-4">Bestsellers</p>
            <h2 className="font-heading text-4xl md:text-5xl font-light text-white">Featured Fragrances</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/products">
              <button className="btn-outline" data-testid="view-all-btn">
                View All Products
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Shop by Mood */}
      <section className="py-32 px-6" data-testid="mood-section">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-luxury-gold text-xs tracking-[0.3em] uppercase mb-4">Find Your Vibe</p>
            <h2 className="font-heading text-4xl md:text-5xl font-light text-white">Shop by Mood</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {moods.map((mood, idx) => (
              <motion.div
                key={mood.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Link to={mood.link} data-testid={`mood-${mood.name.toLowerCase()}`}>
                  <div className="glass-card p-8 text-center hover:bg-white/5 transition-all duration-500">
                    <div className="text-5xl mb-4">{mood.icon}</div>
                    <h3 className="text-luxury-text text-xl font-light">{mood.name}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Notes */}
      <section className="py-32 px-6 bg-luxury-surface" data-testid="notes-section">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-luxury-gold text-xs tracking-[0.3em] uppercase mb-4">Fragrance Notes</p>
            <h2 className="font-heading text-4xl md:text-5xl font-light text-white">Shop by Notes</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {notes.map((note, idx) => (
              <motion.div
                key={note.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Link to={note.link} data-testid={`note-${note.name.toLowerCase()}`}>
                  <div className="glass-card p-6 text-center border-2 border-luxury-gold/20 hover:border-luxury-gold/60 transition-all duration-500">
                    <h3 className="text-luxury-gold text-lg tracking-wider uppercase">{note.name}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-32 px-6" data-testid="reviews-section">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-luxury-gold text-xs tracking-[0.3em] uppercase mb-4">Testimonials</p>
            <h2 className="font-heading text-4xl md:text-5xl font-light text-white">What Our Clients Say</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="glass-card p-8"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-luxury-gold text-luxury-gold" />
                  ))}
                </div>
                <p className="text-luxury-text text-base leading-relaxed mb-6">
                  "Absolutely stunning fragrances. The quality and longevity are unmatched. My new favorite perfume boutique!"
                </p>
                <p className="text-luxury-gold text-sm tracking-wider">— Satisfied Customer</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
