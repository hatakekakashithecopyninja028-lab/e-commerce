import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Heart, User, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ cart }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
      setSearchQuery('');
    }
  };

  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-luxury-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="font-heading text-2xl font-light text-luxury-gold tracking-wider" data-testid="nav-logo">
            LUXE PARFUM
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/products" className="text-luxury-text hover:text-luxury-gold transition-colors text-sm tracking-wider" data-testid="nav-products">
              SHOP
            </Link>
            <Link to="/products?gender=Men" className="text-luxury-text hover:text-luxury-gold transition-colors text-sm tracking-wider" data-testid="nav-men">
              MEN
            </Link>
            <Link to="/products?gender=Women" className="text-luxury-text hover:text-luxury-gold transition-colors text-sm tracking-wider" data-testid="nav-women">
              WOMEN
            </Link>
            <Link to="/blogs" className="text-luxury-text hover:text-luxury-gold transition-colors text-sm tracking-wider" data-testid="nav-blogs">
              JOURNAL
            </Link>
          </div>

          <form onSubmit={handleSearch} className="hidden md:flex items-center bg-luxury-surface border border-luxury-border px-4 py-2 rounded-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="bg-transparent text-luxury-text outline-none text-sm w-48"
              data-testid="search-input"
            />
            <button type="submit" data-testid="search-btn">
              <Search className="w-4 h-4 text-luxury-muted" />
            </button>
          </form>

          <div className="flex items-center space-x-6">
            <Link to="/wishlist" className="text-luxury-text hover:text-luxury-gold transition-colors" data-testid="nav-wishlist">
              <Heart className="w-5 h-5" />
            </Link>
            <Link to="/cart" className="relative text-luxury-text hover:text-luxury-gold transition-colors" data-testid="nav-cart">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-luxury-gold text-black text-xs w-5 h-5 rounded-full flex items-center justify-center" data-testid="cart-count">
                  {cartCount}
                </span>
              )}
            </Link>
            {user ? (
              <div className="relative group">
                <button className="text-luxury-text hover:text-luxury-gold transition-colors" data-testid="user-menu-btn">
                  <User className="w-5 h-5" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 glass-card border border-luxury-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link to="/orders" className="block px-4 py-2 text-sm text-luxury-text hover:text-luxury-gold" data-testid="nav-orders">
                    My Orders
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="block px-4 py-2 text-sm text-luxury-text hover:text-luxury-gold" data-testid="nav-admin">
                      Admin Panel
                    </Link>
                  )}
                  <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-luxury-text hover:text-luxury-gold" data-testid="logout-btn">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="text-luxury-text hover:text-luxury-gold transition-colors text-sm tracking-wider" data-testid="nav-login">
                LOGIN
              </Link>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-luxury-text" data-testid="mobile-menu-btn">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 border-t border-luxury-border pt-4"
            >
              <Link to="/products" className="block py-2 text-luxury-text hover:text-luxury-gold" data-testid="mobile-products">
                SHOP
              </Link>
              <Link to="/products?gender=Men" className="block py-2 text-luxury-text hover:text-luxury-gold" data-testid="mobile-men">
                MEN
              </Link>
              <Link to="/products?gender=Women" className="block py-2 text-luxury-text hover:text-luxury-gold" data-testid="mobile-women">
                WOMEN
              </Link>
              <Link to="/blogs" className="block py-2 text-luxury-text hover:text-luxury-gold" data-testid="mobile-blogs">
                JOURNAL
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;