import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, User as UserIcon, XCircle, ShieldCheck, Menu, X } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';

export default function Navbar() {
  const [pendingCount, setPendingCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(JSON.parse(sessionStorage.getItem('user') || 'null'));
  const location = useLocation();

  // Sync user state with sessionStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(sessionStorage.getItem('user') || 'null'));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storage-update', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage-update', handleStorageChange);
    };
  }, []);

  const fetchCounts = async () => {
    if (!user || !user.group_id) return;
    try {
      const { data: scoreboard } = await api.get('/game/scoreboard');
      setPlayerCount(scoreboard.length);

      if (user.role === 'doctor') {
        const { data: pending } = await api.get('/game/pending-questions');
        setPendingCount(pending.length);
      }
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  };

  useEffect(() => {
    if (!user || !user.group_id) {
      setPlayerCount(0);
      setPendingCount(0);
      return;
    }

    fetchCounts();

    if (socket.connected) {
      socket.emit('join', { userId: user.id, role: user.role, groupId: user.group_id });
    }

    const onConnect = () => {
      socket.emit('join', { userId: user.id, role: user.role, groupId: user.group_id });
    };

    const listener = () => {
      fetchCounts();
    };

    socket.on('connect', onConnect);
    socket.on('group_updated', listener);
    socket.on('new_question', listener);
    socket.on('question_removed', listener);

    return () => {
      socket.off('connect', onConnect);
      socket.off('group_updated', listener);
      socket.off('new_question', listener);
      socket.off('question_removed', listener);
    };
  }, [user?.group_id, user?.role]);

  const handleLogout = async () => {
    try {
      if (user?.groupCode || user?.group_id) {
        await api.post('/auth/leave-group');
      }
    } catch (e) {
      console.error(e);
    }
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = '/auth';
  };

  const handleLeaveGroup = async () => {
    try {
      if (user.groupCode || user.group_id) {
        await api.post('/auth/leave-group');
        user.group_id = null;
        user.groupCode = null;
        sessionStorage.setItem('user', JSON.stringify(user));
        window.location.href = '/auth';
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-dark/80 backdrop-blur-lg border-b border-glassBorder">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-1.5 md:gap-2 group shrink-0">
          <span className="text-secondary group-hover:drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] transition-all">Human</span>
          <span className="text-gray-500 font-light text-[10px] md:text-sm">vs</span>
          <span className="text-primary group-hover:drop-shadow-[0_0_8px_rgba(14,165,233,0.8)] transition-all">AI</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-8">
          <div className="flex gap-6 text-sm font-medium">
            <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
              About
            </Link>
            {user && (
              <>
                <Link to="/scoreboard" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  Scoreboard
                  {user.group_id && playerCount > 0 && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-bold uppercase tracking-tighter animate-fade-in">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-[pulse_2s_ease-in-out_infinite]"></span>
                      {playerCount}
                    </span>
                  )}
                </Link>
                {user.role === 'doctor' && (
                  <Link to="/doctor" className="text-secondary hover:text-white transition-colors flex items-center gap-2">
                    Doctor Panel
                    {pendingCount > 0 && (
                      <span className="bg-secondary text-white text-[10px] font-black px-1.5 py-0.5 rounded-md animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                )}
                {user.role === 'user' && (
                  <Link to="/ask" className="text-primary hover:text-white transition-colors">
                    Play
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin/prompt" className="flex items-center gap-1 text-yellow-400 hover:text-white transition-colors">
                    <ShieldCheck size={13} />
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-4 pl-6 border-l border-glassBorder">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                {user.group_id && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-dark/80 text-xs text-gray-400 font-mono tracking-wider border border-glassBorder mr-2">
                    <span>CODE: <span className="text-white font-bold">{user.groupCode || 'ACTIVE'}</span></span>
                    <button
                      onClick={handleLeaveGroup}
                      className="ml-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/20 rounded p-1 transition-all"
                      title="Leave Group"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                )}
                <div className="p-1.5 rounded-full bg-glass border border-glassBorder">
                  <UserIcon size={14} className="text-primary" />
                </div>
                <span>{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden items-center gap-3">
          {user?.group_id && (
             <div className="px-2 py-1 rounded bg-dark/80 text-[10px] text-gray-400 font-mono border border-glassBorder uppercase tracking-tighter">
                GRP: <span className="text-white font-bold">{user.groupCode || '...'}</span>
             </div>
          )}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-gray-400 hover:text-white transition-all"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-[#030712] z-40 animate-fade-in border-t border-glassBorder flex flex-col p-6 gap-8">
          <div className="flex flex-col gap-6">
            <Link 
              to="/about" 
              onClick={() => setIsMenuOpen(false)}
              className="text-xl text-gray-300 hover:text-white flex items-center gap-3"
            >
              About
            </Link>
            {user && (
              <>
                <Link 
                  to="/scoreboard" 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-xl text-gray-300 hover:text-white flex items-center justify-between"
                >
                  Scoreboard
                  {playerCount > 0 && (
                    <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30">
                      {playerCount} Active
                    </span>
                  )}
                </Link>
                {user.role === 'doctor' && (
                  <Link 
                    to="/doctor" 
                    onClick={() => setIsMenuOpen(false)}
                    className="text-xl text-secondary hover:text-white flex items-center justify-between"
                  >
                    Doctor Panel
                    {pendingCount > 0 && (
                      <span className="text-xs px-2 py-1 rounded bg-secondary/20 text-secondary border border-secondary/30 font-bold">
                        {pendingCount} Pending
                      </span>
                    )}
                  </Link>
                )}
                {user.role === 'user' && (
                  <Link 
                    to="/ask" 
                    onClick={() => setIsMenuOpen(false)}
                    className="text-xl text-primary hover:text-white"
                  >
                    Play Game
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link 
                    to="/admin/prompt" 
                    onClick={() => setIsMenuOpen(false)}
                    className="text-xl text-yellow-400 hover:text-white flex items-center gap-3"
                  >
                    <ShieldCheck size={20} />
                    Admin Settings
                  </Link>
                )}
              </>
            )}
          </div>

          {user && (
            <div className="mt-auto border-t border-glassBorder pt-6 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-glass border border-glassBorder shadow-lg">
                  <UserIcon size={20} className="text-primary" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Logged in as</div>
                  <div className="text-lg text-white font-bold">{user.username}</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                {user.group_id && (
                  <button
                    onClick={() => { handleLeaveGroup(); setIsMenuOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 font-bold"
                  >
                    <XCircle size={18} />
                    Leave Group
                  </button>
                )}
                <button
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-500/10 text-gray-400 border border-glassBorder font-bold"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
