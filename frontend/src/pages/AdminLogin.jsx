import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User } from 'lucide-react';
import api from '../services/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in as admin, redirect immediately
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user && user.role === 'admin') {
      navigate('/admin/prompt');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        username: formData.username,
        password: formData.password,
      });

      if (data.user.role !== 'admin') {
        setError('Admin access only. This portal is restricted to administrators.');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/admin/prompt');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] relative">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-yellow-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="glass p-10 w-full max-w-md rounded-3xl shadow-2xl animate-fade-in-up relative z-10 border border-yellow-500/20">

        {/* Icon header */}
        <div className="flex justify-center mb-8">
          <div className="p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 animate-float">
            <ShieldCheck size={40} className="text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-1 text-center text-white tracking-tight">Admin Portal</h1>
        <p className="text-sm text-gray-500 text-center mb-8">Restricted access — administrators only</p>

        {error && (
          <div className="p-4 rounded-xl mb-6 text-sm text-center font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-400 mb-1.5 ml-1">
              <User size={13} />
              Username
            </label>
            <input
              required
              type="text"
              autoComplete="username"
              className="w-full bg-dark/50 border border-glassBorder rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/40 transition-all placeholder-gray-600"
              placeholder="Admin username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-400 mb-1.5 ml-1">
              <Lock size={13} />
              Password
            </label>
            <input
              required
              type="password"
              autoComplete="current-password"
              className="w-full bg-dark/50 border border-glassBorder rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/40 transition-all placeholder-gray-600"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-dark font-bold py-3.5 rounded-xl hover:shadow-[0_0_24px_rgba(234,179,8,0.4)] hover:scale-[1.02] transition-all mt-4 disabled:opacity-70 disabled:hover:scale-100"
          >
            {isLoading ? 'Authenticating…' : 'Sign In as Admin'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-600">
          Not an admin?{' '}
          <a href="/auth" className="text-gray-400 hover:text-white transition-colors underline underline-offset-4">
            Go to main login
          </a>
        </p>
      </div>
    </div>
  );
}
