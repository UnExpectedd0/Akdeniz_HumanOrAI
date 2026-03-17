import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { BrainCircuit, User } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
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
        setIsLogin(true); 
        setError('Registered successfully. Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="glass p-10 w-full max-w-md rounded-3xl shadow-2xl animate-fade-in-up relative z-10 border border-glassBorder/50">
        
        <div className="flex justify-center mb-10">
          <div className="flex items-center space-x-4 bg-dark/50 p-4 rounded-2xl border border-glassBorder">
            <div className="flex flex-col items-center animate-float">
              <BrainCircuit className="text-primary drop-shadow-[0_0_10px_rgba(14,165,233,0.8)]" size={40} />
            </div>
            <span className="text-gray-500 text-xl font-light italic">VS</span>
            <div className="flex flex-col items-center animate-float" style={{ animationDelay: '1s' }}>
              <User className="text-secondary drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" size={40} />
            </div>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mb-6 text-center text-white tracking-tight">
          {isLogin ? 'Welcome Back' : 'Join the Game'}
        </h2>
        
        {error && (
          <div className={`p-4 rounded-xl mb-6 text-sm text-center font-medium ${error.includes('success') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Username</label>
            <input 
              required
              type="text" 
              className="w-full bg-dark/50 border border-glassBorder rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-600"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Password</label>
            <input 
              required
              type="password" 
              className="w-full bg-dark/50 border border-glassBorder rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-600"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {!isLogin && (
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-400 mb-3 ml-1">I want to play as a...</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer border-2 transition-all ${formData.role === 'user' ? 'border-primary bg-primary/10' : 'border-glassBorder bg-dark/50 hover:bg-dark/80'}`}>
                  <input type="radio" name="role" value="user" className="hidden" onChange={(e) => setFormData({...formData, role: e.target.value})} />
                  <span className="text-lg font-bold text-white mb-1">Player</span>
                  <span className="text-xs text-gray-400 text-center">Guess who answers</span>
                </label>
                <label className={`flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer border-2 transition-all ${formData.role === 'doctor' ? 'border-secondary bg-secondary/10' : 'border-glassBorder bg-dark/50 hover:bg-dark/80'}`}>
                  <input type="radio" name="role" value="doctor" className="hidden" onChange={(e) => setFormData({...formData, role: e.target.value})} />
                  <span className="text-lg font-bold text-white mb-1">Doctor</span>
                  <span className="text-xs text-gray-400 text-center">Answer questions</span>
                </label>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-[1.02] transition-all mt-6 disabled:opacity-70 disabled:hover:scale-100"
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Login Now' : 'Create Account')}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400 text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-white font-semibold hover:text-primary transition-colors underline decoration-primary/50 underline-offset-4">
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
