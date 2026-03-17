import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function Scoreboard() {
  const [users, setUsers] = array;
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

  if (loading) return <div className="text-center mt-20 text-gray-400 animate-pulse">Loading Scores...</div>;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <h2 className="text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        Global Scoreboard
      </h2>
      
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-sm uppercase tracking-wider">
              <th className="p-4 rounded-tl-xl text-center">Rank</th>
              <th className="p-4">Player / Doctor</th>
              <th className="p-4">Role</th>
              <th className="p-4 rounded-tr-xl text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {usersData.map((user, index) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 text-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-400' : 
                    index === 1 ? 'bg-gray-300/20 text-gray-300' : 
                    index === 2 ? 'bg-amber-600/20 text-amber-500' : 'text-gray-500'
                  }`}>
                    {index + 1}
                  </span>
                </td>
                <td className="p-4 font-medium text-white text-lg">
                  {user.username}
                </td>
                <td className="p-4 text-gray-400 capitalize">
                  {user.role}
                </td>
                <td className="p-4 text-right">
                  <span className="text-2xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                    {user.score}
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
