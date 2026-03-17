import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { BrainCircuit, User } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        const { data } = await api.post('/auth/login', {
          username: formData.username,
          password: formData.password
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate(data.user.role === 'doctor' ? '/doctor' : '/ask');
      } else {
        await api.post('/auth/register', formData);
        setIsLogin(true); // Switch to login after register
        setError('Registered successfully. Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="glass p-8 w-full max-w-md rounded-2xl shadow-2xl animate-fade-in-up">
        
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            <BrainCircuit className="text-primary" size={32} />
            <span className="text-gray-400 text-2xl">vs</span>
            <User className="text-secondary" size={32} />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mb-6 text-center text-white">
          {isLogin ? 'Welcome Back' : 'Join the Game'}
        </h2>
        
        {error && (
          <div className={`p-3 rounded mb-4 text-sm text-center ${error.includes('success') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
            <input 
              required
              type="text" 
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input 
              required
              type="password" 
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">I am a...</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="role" value="user" checked={formData.role === 'user'} onChange={(e) => setFormData({...formData, role: e.target.value})} />
                  <span className="text-gray-300">Player</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="role" value="doctor" checked={formData.role === 'doctor'} onChange={(e) => setFormData({...formData, role: e.target.value})} />
                  <span className="text-gray-300">Doctor</span>
                </label>
              </div>
            </div>
          )}

          <button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded hover:opacity-90 transition-opacity mt-4">
            {isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400 text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-primary hover:underline">
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
