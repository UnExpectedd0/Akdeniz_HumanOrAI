import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function Scoreboard() {
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScores();
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
      <div className="text-center mb-10">
        <h2 className="text-5xl font-black mb-2 tracking-tight drop-shadow-md text-white">
          Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Scoreboard</span>
        </h2>
        <p className="text-gray-400 font-light text-lg">The sharpest minds, human or artificial.</p>
      </div>
      
      <div className="glass rounded-3xl overflow-hidden shadow-2xl border border-glassBorder/50 backdrop-blur-xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 blur-[80px] rounded-full pointer-events-none"></div>

        <table className="w-full text-left relative z-10">
          <thead>
            <tr className="bg-dark/60 text-gray-400 text-xs uppercase tracking-[0.15em] border-b border-glassBorder/50">
              <th className="px-6 py-5 font-bold w-24 text-center">Rank</th>
              <th className="px-6 py-5 font-bold">Player Name</th>
              <th className="px-6 py-5 font-bold hidden sm:table-cell">Faction</th>
              <th className="px-6 py-5 font-bold text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glassBorder/30">
            {usersData.map((user, index) => (
              <tr 
                key={user.id} 
                className="group hover:bg-white/5 transition-colors cursor-default"
              >
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-lg shadow-inner ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-dark shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-dark shadow-[0_0_15px_rgba(156,163,175,0.4)]' : 
                    index === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-[0_0_15px_rgba(217,119,6,0.4)]' : 
                    'bg-dark/80 text-gray-500 border border-glassBorder'
                  }`}>
                    {index + 1}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-white text-xl flex items-center gap-3">
                    {user.username}
                    {index === 0 && <span className="text-xl animate-bounce">👑</span>}
                  </div>
                </td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    user.role === 'doctor' 
                      ? 'bg-secondary/10 text-secondary border-secondary/20 group-hover:border-secondary/50' 
                      : 'bg-primary/10 text-primary border-primary/20 group-hover:border-primary/50'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`text-3xl font-black ${
                    index < 3 ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 flex justify-end items-center gap-2' : 'text-gray-300'
                  }`}>
                    {user.score} <span className="text-yellow-500 text-xl">★</span>
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
