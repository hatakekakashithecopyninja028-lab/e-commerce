import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProductListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    gender: searchParams.get('gender') || '',
    mood: searchParams.get('mood') || '',
    season: searchParams.get('season') || '',
    note: searchParams.get('note') || '',
    min_price: '',
    max_price: '',
    sort: 'newest'
  });

  useEffect(() => {
    fetchProducts();
  }, [searchParams, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.mood) params.append('mood', filters.mood);
      if (filters.season) params.append('season', filters.season);
      if (filters.note) params.append('note', filters.note);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (searchParams.get('search')) params.append('search', searchParams.get('search'));
      params.append('sort', filters.sort);
      params.append('page', page);
      params.append('limit', 12);

      const { data } = await axios.get(`${API}/products?${params.toString()}`);
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.gender) params.set('gender', filters.gender);
    if (filters.mood) params.set('mood', filters.mood);
    if (filters.season) params.set('season', filters.season);
    if (filters.note) params.set('note', filters.note);
    if (searchParams.get('search')) params.set('search', searchParams.get('search'));
    setSearchParams(params);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-luxury-bg pt-32 px-6 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <div className="glass-card p-6 sticky top-32" data-testid="filters-sidebar">
              <div className="flex items-center gap-2 mb-6">
                <SlidersHorizontal className="w-5 h-5 text-luxury-gold" />
                <h3 className="text-luxury-text font-medium tracking-wider">FILTERS</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-luxury-text text-sm mb-2">Gender</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters({...filters, gender: e.target.value})}
                    className="w-full bg-luxury-surface border border-luxury-border text-luxury-text px-3 py-2 outline-none focus:border-luxury-gold transition-colors"
                    data-testid="filter-gender"
                  >
                    <option value="">All</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>

                <div>
                  <label className="block text-luxury-text text-sm mb-2">Mood</label>
                  <select
                    value={filters.mood}
                    onChange={(e) => setFilters({...filters, mood: e.target.value})}
                    className="w-full bg-luxury-surface border border-luxury-border text-luxury-text px-3 py-2 outline-none focus:border-luxury-gold transition-colors"
                    data-testid="filter-mood"
                  >
                    <option value="">All</option>
                    <option value="Office">Office</option>
                    <option value="Party">Party</option>
                    <option value="Daily">Daily</option>
                    <option value="Gym">Gym</option>
                  </select>
                </div>

                <div>
                  <label className="block text-luxury-text text-sm mb-2">Season</label>
                  <select
                    value={filters.season}
                    onChange={(e) => setFilters({...filters, season: e.target.value})}
                    className="w-full bg-luxury-surface border border-luxury-border text-luxury-text px-3 py-2 outline-none focus:border-luxury-gold transition-colors"
                    data-testid="filter-season"
                  >
                    <option value="">All</option>
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-luxury-text text-sm mb-2">Note</label>
                  <select
                    value={filters.note}
                    onChange={(e) => setFilters({...filters, note: e.target.value})}
                    className="w-full bg-luxury-surface border border-luxury-border text-luxury-text px-3 py-2 outline-none focus:border-luxury-gold transition-colors"
                    data-testid="filter-note"
                  >
                    <option value="">All</option>
                    <option value="Woody">Woody</option>
                    <option value="Floral">Floral</option>
                    <option value="Fresh">Fresh</option>
                    <option value="Oud">Oud</option>
                  </select>
                </div>

                <div>
                  <label className="block text-luxury-text text-sm mb-2">Price Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.min_price}
                      onChange={(e) => setFilters({...filters, min_price: e.target.value})}
                      className="w-1/2 bg-luxury-surface border border-luxury-border text-luxury-text px-3 py-2 outline-none focus:border-luxury-gold transition-colors"
                      data-testid="filter-min-price"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.max_price}
                      onChange={(e) => setFilters({...filters, max_price: e.target.value})}
                      className="w-1/2 bg-luxury-surface border border-luxury-border text-luxury-text px-3 py-2 outline-none focus:border-luxury-gold transition-colors"
                      data-testid="filter-max-price"
                    />
                  </div>
                </div>

                <button onClick={applyFilters} className="w-full btn-primary" data-testid="apply-filters-btn">
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-8">
              <p className="text-luxury-muted" data-testid="products-count">{total} Products</p>
              <select
                value={filters.sort}
                onChange={(e) => {
                  setFilters({...filters, sort: e.target.value});
                  setPage(1);
                }}
                className="bg-luxury-surface border border-luxury-border text-luxury-text px-4 py-2 outline-none focus:border-luxury-gold transition-colors"
                data-testid="sort-select"
              >
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="best_selling">Best Selling</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <p className="text-luxury-muted">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-luxury-muted">No products found</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="products-grid">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {total > 12 && (
                  <div className="flex justify-center gap-2 mt-12">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-outline disabled:opacity-50 px-4 py-2"
                      data-testid="prev-page-btn"
                    >
                      Previous
                    </button>
                    <span className="flex items-center px-4 text-luxury-text">Page {page}</span>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page * 12 >= total}
                      className="btn-outline disabled:opacity-50 px-4 py-2"
                      data-testid="next-page-btn"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListingPage;
