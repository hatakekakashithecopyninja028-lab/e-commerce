import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-luxury-surface border-t border-luxury-border mt-32">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3 className="font-heading text-2xl font-light text-luxury-gold mb-4">LUXE PARFUM</h3>
            <p className="text-luxury-muted text-sm leading-relaxed">
              Discover the world's finest fragrances. Curated luxury perfumes for the discerning individual.
            </p>
          </div>
          
          <div>
            <h4 className="text-luxury-text font-medium mb-4 tracking-wider text-sm">SHOP</h4>
            <ul className="space-y-2">
              <Link to="/products?gender=Men" className="block text-luxury-muted hover:text-luxury-gold text-sm transition-colors">Men's Fragrances</Link>
              <Link to="/products?gender=Women" className="block text-luxury-muted hover:text-luxury-gold text-sm transition-colors">Women's Fragrances</Link>
              <Link to="/products?gender=Unisex" className="block text-luxury-muted hover:text-luxury-gold text-sm transition-colors">Unisex Collection</Link>
            </ul>
          </div>
          
          <div>
            <h4 className="text-luxury-text font-medium mb-4 tracking-wider text-sm">HELP</h4>
            <ul className="space-y-2">
              <li className="text-luxury-muted hover:text-luxury-gold text-sm transition-colors cursor-pointer">Contact Us</li>
              <li className="text-luxury-muted hover:text-luxury-gold text-sm transition-colors cursor-pointer">Shipping Info</li>
              <li className="text-luxury-muted hover:text-luxury-gold text-sm transition-colors cursor-pointer">Returns</li>
              <li className="text-luxury-muted hover:text-luxury-gold text-sm transition-colors cursor-pointer">FAQ</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-luxury-text font-medium mb-4 tracking-wider text-sm">FOLLOW US</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-luxury-muted hover:text-luxury-gold transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-luxury-muted hover:text-luxury-gold transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-luxury-muted hover:text-luxury-gold transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-luxury-border mt-12 pt-8 text-center">
          <p className="text-luxury-muted text-sm">
            © 2026 Luxe Parfum. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;