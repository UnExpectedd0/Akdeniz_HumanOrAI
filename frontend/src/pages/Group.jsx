import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Group() {
  const [groupCodeInput, setGroupCodeInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    if (user.role === 'admin') {
      window.location.href = '/admin/prompt';
      return;
    }
    if (user.group_id) {
      window.location.href = user.role === 'doctor' ? '/doctor' : '/ask';
    }
  }, []);

  const handleCreateGroup = async () => {
    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/create-group');
      const user = JSON.parse(sessionStorage.getItem('user'));
      user.group_id = data.groupId;
      user.groupCode = data.groupCode;
      sessionStorage.setItem('user', JSON.stringify(user));
      window.location.href = user.role === 'doctor' ? '/doctor' : '/ask';
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create group');
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
      const user = JSON.parse(sessionStorage.getItem('user'));
      user.group_id = data.groupId;
      user.groupCode = data.groupCode;
      sessionStorage.setItem('user', JSON.stringify(user));
      window.location.href = user.role === 'doctor' ? '/doctor' : '/ask';
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to join group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="glass p-10 w-full max-w-md rounded-3xl shadow-2xl animate-fade-in-up relative z-10 border border-glassBorder/50">
        <h2 className="text-3xl font-bold mb-6 text-center text-white tracking-tight">
          Session Info
        </h2>

        {error && (
          <div className="p-4 rounded-xl mb-6 text-sm text-center font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

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
      </div>
    </div>
  );
}
