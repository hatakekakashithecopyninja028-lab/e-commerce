import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await register(email, password, name);
    setLoading(false);

    if (result.success) {
      toast.success('Registration successful!');
      navigate('/');
    } else {
      toast.error(result.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-luxury-bg px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8">
          <h1 className="font-heading text-4xl font-light text-luxury-gold mb-2" data-testid="register-title">Create Account</h1>
          <p className="text-luxury-muted mb-8">Join the luxury experience</p>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="register-form">
            <div>
              <label className="block text-luxury-text text-sm mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border-b border-luxury-border focus:border-luxury-gold text-luxury-text px-0 py-3 outline-none transition-colors"
                required
                data-testid="register-name"
              />
            </div>

            <div>
              <label className="block text-luxury-text text-sm mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-luxury-border focus:border-luxury-gold text-luxury-text px-0 py-3 outline-none transition-colors"
                required
                data-testid="register-email"
              />
            </div>

            <div>
              <label className="block text-luxury-text text-sm mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-luxury-border focus:border-luxury-gold text-luxury-text px-0 py-3 outline-none transition-colors"
                required
                data-testid="register-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
              data-testid="register-submit-btn"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-luxury-muted text-sm mt-6 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-luxury-gold hover:text-luxury-gold-light" data-testid="login-link">
              Sign in here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
