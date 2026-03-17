import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-dark/80 backdrop-blur-md border-b border-glassBorder">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black tracking-tight flex items-center gap-2 group">
          <span className="text-secondary group-hover:drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] transition-all">Human</span>
          <span className="text-gray-500 font-light text-sm">vs</span>
          <span className="text-primary group-hover:drop-shadow-[0_0_8px_rgba(14,165,233,0.8)] transition-all">AI</span>
        </Link>
        
        {user && (
          <div className="flex items-center gap-8">
            <div className="flex gap-6 text-sm font-medium">
              <Link to="/scoreboard" className="text-gray-400 hover:text-white transition-colors">
                Scoreboard
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
            </div>

            <div className="flex items-center gap-4 pl-6 border-l border-glassBorder">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="p-1.5 rounded-full bg-glass border border-glassBorder">
                  <UserIcon size={14} className="text-primary" />
                </div>
                <span>{user.username}</span>
                <span className="px-2 py-0.5 rounded-full bg-glass text-xs text-yellow-500 font-bold border border-yellow-500/20">
                  ★ {user.score || 0}
                </span>
              </div>
              <button 
                onClick={handleLogout} 
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
