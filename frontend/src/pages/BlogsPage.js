import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BlogsPage = () => {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data } = await axios.get(`${API}/blogs`);
      setBlogs(data);
    } catch (error) {
      console.error('Failed to fetch blogs');
    }
  };

  return (
    <div className="min-h-screen bg-luxury-bg pt-32 px-6 pb-16">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-heading text-5xl font-light text-luxury-text mb-16 text-center" data-testid="blogs-title">Journal</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog, idx) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="glass-card overflow-hidden group"
              data-testid={`blog-${blog.id}`}
            >
              <div className="h-64 overflow-hidden">
                <img
                  src={blog.image_url || 'https://images.pexels.com/photos/7702669/pexels-photo-7702669.jpeg'}
                  alt={blog.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="p-6">
                <span className="text-luxury-gold text-xs tracking-wider uppercase">{blog.category}</span>
                <h2 className="font-heading text-2xl font-light text-luxury-text mt-2 mb-3">{blog.title}</h2>
                <p className="text-luxury-muted text-sm line-clamp-3 mb-4">{blog.content}</p>
                <Link to={`/blogs/${blog.id}`} className="text-luxury-gold text-sm tracking-wider hover:text-luxury-gold-light">
                  Read More →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogsPage;
