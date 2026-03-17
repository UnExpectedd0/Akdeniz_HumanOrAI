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
    <nav className="fixed top-0 w-full z-50 glass border-b border-gray-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Human or AI?
        </Link>
        
        {user && (
          <div className="flex items-center gap-6">
            <Link to="/scoreboard" className="text-gray-300 hover:text-white transition-colors">
              Scoreboard
            </Link>
            {user.role === 'doctor' && (
              <Link to="/doctor" className="text-gray-300 hover:text-white transition-colors">
                Doctor Panel
              </Link>
            )}
            {user.role === 'user' && (
              <Link to="/ask" className="text-gray-300 hover:text-white transition-colors">
                Play
              </Link>
            )}
            <div className="flex items-center gap-4 border-l border-gray-700 pl-4">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <UserIcon size={16} className="text-primary" />
                <span>{user.username} <span className="text-xs text-gray-500">({user.role})</span></span>
                <span className="font-bold text-secondary">★ {user.score || 0}</span>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
