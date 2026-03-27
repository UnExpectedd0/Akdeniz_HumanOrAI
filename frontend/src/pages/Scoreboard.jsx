import React, { useEffect, useState } from 'react';
import socket from '../services/socket';
import api from '../services/api';

export default function Scoreboard() {
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(sessionStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    if (!user.group_id) {
      window.location.href = '/group';
      return;
    }

    fetchScores();

    if (socket.connected) {
      socket.emit('join', { userId: user.id, role: user.role, groupId: user.group_id });
    }

    const onConnect = () => {
      socket.emit('join', { userId: user.id, role: user.role, groupId: user.group_id });
    };

    const onGroupUpdated = () => {
      fetchScores();
    };

    socket.on('connect', onConnect);
    socket.on('group_updated', onGroupUpdated);

    return () => {
      socket.off('connect', onConnect);
      socket.off('group_updated', onGroupUpdated);
    };
  }, []);

  const fetchScores = async () => {
    try {
      const { data } = await api.get('/game/scoreboard');
      setUsersData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <div className="text-xl text-primary font-bold animate-pulse">Loading Global Ranks...</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="text-center mb-6 md:mb-10 px-2">
        <h2 className="text-3xl md:text-5xl font-black mb-2 tracking-tight drop-shadow-md text-white">
          Session <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Scoreboard</span>
        </h2>
        <p className="text-gray-400 font-light text-sm md:text-lg">The sharpest minds, human or artificial.</p>
      </div>
      
      <div className="glass rounded-2xl md:rounded-3xl overflow-x-auto shadow-2xl border border-glassBorder/50 backdrop-blur-xl relative mx-1 md:mx-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 blur-[80px] rounded-full pointer-events-none"></div>

        <table className="w-full text-left relative z-10">
          <thead>
            <tr className="bg-dark/60 text-gray-400 text-[10px] md:text-xs uppercase tracking-[0.15em] border-b border-glassBorder/50">
              <th className="px-3 md:px-6 py-4 md:py-5 font-bold w-16 md:w-24 text-center">Rank</th>
              <th className="px-3 md:px-6 py-4 md:py-5 font-bold">Player Name</th>
              <th className="px-4 py-4 md:py-5 font-bold hidden sm:table-cell">Faction</th>
              <th className="px-3 md:px-6 py-4 md:py-5 font-bold text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glassBorder/30">
            {usersData.map((user, index) => (
              <tr 
                key={user.id} 
                className="group hover:bg-white/5 transition-colors cursor-default"
              >
                <td className="px-3 md:px-6 py-4 text-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl font-black text-sm md:text-lg shadow-inner ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-dark' : 
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-dark' : 
                    index === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white' : 
                    'bg-dark/80 text-gray-500 border border-glassBorder'
                  }`}>
                    {index + 1}
                  </span>
                </td>
                <td className="px-3 md:px-6 py-4">
                  <div className="font-bold text-white text-base md:text-xl flex items-center gap-2 md:gap-3 truncate max-w-[120px] md:max-w-none">
                    {user.username}
                    {index === 0 && <span className="text-sm md:text-xl animate-bounce">👑</span>}
                  </div>
                </td>
                <td className="px-4 py-4 hidden sm:table-cell text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    user.role === 'doctor' 
                      ? 'bg-secondary/10 text-secondary border-secondary/20' 
                      : 'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-3 md:px-6 py-4 text-right">
                  <span className={`text-xl md:text-3xl font-black ${
                    index < 3 ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 flex justify-end items-center gap-1 md:gap-2' : 'text-gray-300'
                  }`}>
                    {user.score} <span className="text-yellow-500 text-xs md:text-xl">★</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
