import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function Group() {
  const [groups, setGroups] = useState([]);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupCodeInput, setGroupCodeInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = JSON.parse(sessionStorage.getItem('user') || 'null');
  const { t } = useLanguage();

  const fetchGroups = useCallback(async () => {
    try {
      const { data } = await api.get('/game/groups');
      setGroups(data);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      window.location.href = '/auth';
      return;
    }
    if (currentUser.role === 'admin') {
      window.location.href = '/admin/prompt';
      return;
    }

    fetchGroups();
    const interval = setInterval(fetchGroups, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [currentUser, fetchGroups]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupNameInput.trim()) return;
    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/create-group', { name: groupNameInput.trim() });
      const user = JSON.parse(sessionStorage.getItem('user'));
      user.group_id = data.groupId;
      user.groupCode = data.groupCode;
      user.groupName = data.groupName;
      sessionStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('storage-update'));
      window.location.href = user.role === 'doctor' ? '/doctor' : '/ask';
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinById = async (groupId) => {
    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/join-group', { groupId });
      const user = JSON.parse(sessionStorage.getItem('user'));
      user.group_id = data.groupId;
      user.groupCode = data.groupCode;
      sessionStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('storage-update'));
      window.location.href = user.role === 'doctor' ? '/doctor' : '/ask';
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to join group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!groupCodeInput.trim()) return;
    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/join-group', { code: groupCodeInput.trim() });
      const user = JSON.parse(sessionStorage.getItem('user'));
      user.group_id = data.groupId;
      user.groupCode = data.groupCode;
      sessionStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('storage-update'));
      window.location.href = user.role === 'doctor' ? '/doctor' : '/ask';
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to join group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (e, groupId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this group? All stats and questions will be lost.')) return;
    try {
      await api.delete(`/game/groups/${groupId}`);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete group');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-fade-in-up">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter">
          Operations <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Deck</span>
        </h2>
        <p className="text-gray-400 text-lg">{t('group.subtitle')}</p>
      </div>

      {error && (
        <div className="max-w-md mx-auto p-4 rounded-2xl mb-8 text-center bg-red-500/10 text-red-400 border border-red-500/20 backdrop-blur-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Create Group */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-8 rounded-3xl border border-glassBorder/50 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-[50px] rounded-full"></div>
            <h3 className="text-2xl font-bold text-white mb-6">{t('group.create_title')}</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2 ml-1">{t('group.create_title')}</label>
                <input
                  required
                  type="text"
                  className="w-full bg-dark/50 border border-glassBorder rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder={t('group.name_placeholder')}
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !groupNameInput.trim()}
                className="w-full bg-primary text-dark font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {t('group.create_button')}
              </button>
            </form>
          </div>

          <div className="glass p-8 rounded-3xl border border-glassBorder/50 shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-bold text-white mb-4">{t('group.join_code_title')}</h3>
            <form onSubmit={handleJoinByCode} className="space-y-4">
              <input
                type="text"
                className="w-full bg-dark/50 border border-glassBorder rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-secondary text-center tracking-[0.3em] uppercase font-bold"
                placeholder={t('group.code')}
                value={groupCodeInput}
                onChange={(e) => setGroupCodeInput(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button
                type="submit"
                disabled={isLoading || groupCodeInput.length < 6}
                className="w-full bg-dark/80 text-white font-bold py-3 rounded-2xl border border-glassBorder hover:border-secondary hover:text-secondary transition-all disabled:opacity-30"
              >
                {t('group.join_code_button')}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Groups Directory */}
        <div className="lg:col-span-8">
          <div className="glass p-8 rounded-3xl border border-glassBorder/50 shadow-2xl min-h-[500px]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-white">{t('group.directory_title')}</h3>
              <span className="bg-white/5 px-4 py-1 rounded-full text-xs font-bold text-gray-500 border border-glassBorder">
                {groups.length} {t('group.ready')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.length === 0 ? (
                <div className="col-span-full py-20 text-center text-gray-500 italic">
                  No active operations found. Be the first to initiate.
                </div>
              ) : groups.map((g) => (
                <div 
                  key={g.id}
                  className="group relative bg-dark/40 border border-glassBorder hover:border-primary/50 p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{g.name}</h4>
                      <code className="text-xs text-gray-500 font-mono uppercase tracking-widest">{g.code}</code>
                    </div>
                    {currentUser.id === g.creator_id && (
                      <button 
                        onClick={(e) => handleDeleteGroup(e, g.id)}
                        className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete Group"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleJoinById(g.id)}
                    disabled={isLoading}
                    className="w-full mt-2 bg-white/5 hover:bg-primary hover:text-dark text-white font-bold py-2.5 rounded-xl border border-glassBorder group-hover:border-primary transition-all disabled:opacity-50"
                  >
                    {t('group.join')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
