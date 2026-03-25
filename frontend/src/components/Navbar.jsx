import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User as UserIcon, XCircle, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';

export default function Navbar() {
  const [playerCount, setPlayerCount] = useState(0);
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user || !user.group_id) return;

    const fetchCount = async () => {
      try {
        const { data } = await api.get('/game/scoreboard');
        setPlayerCount(data.length);
      } catch (err) {
        console.error('Error fetching player count:', err);
      }
    };

    fetchCount();

    if (socket.connected) {
      socket.emit('join', { userId: user.id, role: user.role, groupId: user.group_id });
    }

    const onConnect = () => {
      socket.emit('join', { userId: user.id, role: user.role, groupId: user.group_id });
    };

    const onGroupUpdated = () => {
      fetchCount();
    };

    socket.on('connect', onConnect);
    socket.on('group_updated', onGroupUpdated);

    return () => {
      socket.off('connect', onConnect);
      socket.off('group_updated', onGroupUpdated);
    };
  }, [user?.group_id]);

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
    <nav className="fixed top-0 w-full z-50 bg-dark/80 backdrop-blur-md border-b border-glassBorder">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black tracking-tight flex items-center gap-2 group">
          <span className="text-secondary group-hover:drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] transition-all">Human</span>
          <span className="text-gray-500 font-light text-sm">vs</span>
          <span className="text-primary group-hover:drop-shadow-[0_0_8px_rgba(14,165,233,0.8)] transition-all">AI</span>
        </Link>

        <div className="flex items-center gap-8">
          <div className="flex gap-6 text-sm font-medium">
            {/* About is always visible, even without login */}
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
                  <Link to="/doctor" className="text-secondary hover:text-white transition-colors">
                    Doctor Panel
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
      </div>
    </nav>
  );
}
