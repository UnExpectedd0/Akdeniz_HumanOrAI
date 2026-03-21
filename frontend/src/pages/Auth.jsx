import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BrainCircuit, User } from 'lucide-react';

export default function Auth() {
  const [authMode, setAuthMode] = useState('guest'); // 'guest', 'login', 'register'
  const [formData, setFormData] = useState({ username: '', password: '', secretKey: '' });
  
  const [isGroupStage, setIsGroupStage] = useState(false);
  const [groupCodeInput, setGroupCodeInput] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect appropriately
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return;
    if (user.role === 'admin') {
      window.location.href = '/admin/prompt';
    } else if (user.group_id) {
      window.location.href = user.role === 'doctor' ? '/doctor' : '/ask';
    } else {
      setIsGroupStage(true);
    }
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (authMode === 'guest') {
        const { data } = await api.post('/auth/guest-login', { username: formData.username });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.group_id) {
          window.location.href = '/ask';
        } else {
          setIsGroupStage(true);
        }
      } else if (authMode === 'login') {
        const { data } = await api.post('/auth/login', {
          username: formData.username,
          password: formData.password
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.role === 'admin') {
          window.location.href = '/admin/prompt';
        } else if (data.user.group_id) {
          window.location.href = data.user.role === 'doctor' ? '/doctor' : '/ask';
        } else {
          setIsGroupStage(true);
        }
      } else if (authMode === 'register') {
        await api.post('/auth/register', formData);
        setAuthMode('login'); 
        setError('Registered successfully. Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/create-group');
      const user = JSON.parse(localStorage.getItem('user'));
      user.group_id = data.groupCode;
      user.groupCode = data.groupCode;
      localStorage.setItem('user', JSON.stringify(user));
      window.location.href = user.role === 'doctor' ? '/doctor' : '/ask';
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/join-group', { code: groupCodeInput });
      const user = JSON.parse(localStorage.getItem('user'));
      user.group_id = data.groupCode;
      user.groupCode = data.groupCode;
      localStorage.setItem('user', JSON.stringify(user));
      window.location.href = user.role === 'doctor' ? '/doctor' : '/ask';
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join group');
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
          {isGroupStage ? 'Session Info' : (authMode === 'guest' ? 'Play as Guest' : authMode === 'login' ? 'Doctor Login' : 'Doctor Registration')}
        </h2>
        
        {error && (
          <div className={`p-4 rounded-xl mb-6 text-sm text-center font-medium ${error.includes('success') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {error}
          </div>
        )}

        {!isGroupStage ? (
          <>
            <div className="flex justify-center space-x-2 mb-6 text-sm font-medium">
              <button 
                className={`px-4 py-2 rounded-lg transition-all ${authMode === 'guest' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                onClick={() => setAuthMode('guest')}
              >
                Guest
              </button>
              <button 
                className={`px-4 py-2 rounded-lg transition-all ${authMode === 'login' ? 'bg-secondary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                onClick={() => setAuthMode('login')}
              >
                Doctor Login
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-5">
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
              
              {authMode !== 'guest' && (
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
              )}

              {authMode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5 ml-1 flex items-center gap-2">
                    Invite Code <span className="text-xs text-gray-500 font-normal">(Ask admin)</span>
                  </label>
                  <input 
                    required
                    type="password" 
                    className="w-full bg-dark/50 border border-secondary/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all placeholder-gray-600"
                    placeholder="Enter Invite Code"
                    value={formData.secretKey}
                    onChange={(e) => setFormData({...formData, secretKey: e.target.value})}
                  />
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-[1.02] transition-all mt-6 disabled:opacity-70 disabled:hover:scale-100"
              >
                {isLoading ? 'Processing...' : (authMode === 'guest' ? 'Play Now' : authMode === 'login' ? 'Login' : 'Create Account')}
              </button>
            </form>

            {authMode !== 'guest' && (
              <p className="mt-8 text-center text-gray-400 text-sm">
                {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }} className="text-white font-semibold hover:text-primary transition-colors underline decoration-primary/50 underline-offset-4">
                  {authMode === 'login' ? 'Sign up' : 'Login'}
                </button>
              </p>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className="bg-dark/50 border border-glassBorder p-6 rounded-2xl text-center shadow-inner">
              <h3 className="text-xl font-bold text-white mb-2">Host a Session</h3>
              <p className="text-gray-400 text-sm mb-4">Create a new group and invite others using a code.</p>
              <button 
                onClick={handleCreateGroup}
                disabled={isLoading}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all disabled:opacity-70"
              >
                Create Group
              </button>
            </div>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-glassBorder"></div>
              <span className="flex-shrink-0 mx-4 text-gray-500 font-medium text-sm">OR</span>
              <div className="flex-grow border-t border-glassBorder"></div>
            </div>

            <form onSubmit={handleJoinGroup} className="bg-dark/50 border border-glassBorder p-6 rounded-2xl shadow-inner">
              <h3 className="text-xl font-bold text-white mb-4 text-center">Join a Session</h3>
              <input 
                required
                type="text" 
                className="w-full bg-black/50 border border-glassBorder rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-center tracking-widest uppercase mb-4"
                placeholder="GROUP CODE"
                value={groupCodeInput}
                onChange={(e) => setGroupCodeInput(e.target.value)}
                maxLength={6}
              />
              <button 
                type="submit" 
                disabled={isLoading || !groupCodeInput}
                className="w-full bg-secondary text-white font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all disabled:opacity-70"
              >
                Join Group
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
