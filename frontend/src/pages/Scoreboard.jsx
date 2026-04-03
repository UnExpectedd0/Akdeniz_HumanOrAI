import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Target, ShieldCheck, User as UserIcon } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function Scoreboard() {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');
  const { t } = useLanguage();

  useEffect(() => {
    const fetchScoreboard = async () => {
      try {
        const { data } = await api.get('/game/scoreboard');
        setPlayers(data);
      } catch (err) {
        console.error('Failed to fetch scoreboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScoreboard();
    const interval = setInterval(fetchScoreboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const aTotalSeeker = a.correct_guesses + (a.incorrect_ai || 0) + (a.incorrect_human || 0);
      const aAccuracy = aTotalSeeker > 0 ? (a.correct_guesses / aTotalSeeker) : -1;

      const bTotalSeeker = b.correct_guesses + (b.incorrect_ai || 0) + (b.incorrect_human || 0);
      const bAccuracy = bTotalSeeker > 0 ? (b.correct_guesses / bTotalSeeker) : -1;

      const aTotalDeceiver = a.tricked_users + a.failed_to_trick;
      const aDeception = aTotalDeceiver > 0 ? (a.tricked_users / aTotalDeceiver) : -1;

      const bTotalDeceiver = b.tricked_users + b.failed_to_trick;
      const bDeception = bTotalDeceiver > 0 ? (b.tricked_users / bTotalDeceiver) : -1;

      // Primary sort by the highest rate they have
      const aMax = Math.max(aAccuracy, aDeception);
      const bMax = Math.max(bAccuracy, bDeception);

      return bMax - aMax;
    });
  }, [players]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-fade-in-up">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4">
          <Trophy size={14} />
          {t('scoreboard.badge')}
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter">
          {t('scoreboard.title').split(' ').slice(0,1).join(' ')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{t('scoreboard.title').split(' ').slice(1).join(' ')}</span>
        </h2>
        <p className="text-gray-400 text-lg">{t('scoreboard.desc')}</p>
      </div>

      <div className="glass rounded-[2rem] border border-glassBorder/50 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-50"></div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left relative z-10">
            <thead className="bg-dark/60 text-gray-400 text-[10px] md:text-xs uppercase tracking-[0.2em] border-b border-glassBorder/50">
              <tr>
                <th className="px-8 py-6 font-bold w-1/4">{t('scoreboard.operative')}</th>
                <th className="px-8 py-6 font-bold text-center">{t('scoreboard.performance')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glassBorder/20">
              {sortedPlayers.length === 0 ? (
                <tr>
                  <td colSpan="2" className="py-24 text-center text-gray-500 italic">
                    {t('scoreboard.empty')}
                  </td>
                </tr>
              ) : sortedPlayers.map((p, index) => {
                const totalGuesses = p.correct_guesses + (p.incorrect_ai || 0) + (p.incorrect_human || 0);
                const accuracy = totalGuesses > 0 ? Math.round((p.correct_guesses / totalGuesses) * 100) : 0;
                
                const totalTricks = p.tricked_users + p.failed_to_trick;
                const deceptionRate = totalTricks > 0 ? Math.round((p.tricked_users / totalTricks) * 100) : 0;

                return (
                  <tr key={p.id} className={`group transition-all duration-300 hover:bg-white/[0.03] ${p.id === user?.id ? 'bg-primary/5' : ''}`}>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-6">
                        {/* Rank Circle */}
                        <div className={`relative flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl border transition-transform group-hover:scale-110 ${
                          index === 0 ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' :
                          index === 1 ? 'bg-gray-300/20 border-gray-300/50 text-gray-300' :
                          index === 2 ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' :
                          'bg-dark/50 border-glassBorder text-gray-500'
                        }`}>
                          {index + 1}
                          {index === 0 && <span className="absolute -top-3 -left-3 text-2xl animate-bounce">👑</span>}
                        </div>

                        {/* User Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="text-xl md:text-2xl font-black text-white truncate group-hover:text-primary transition-colors">
                              {p.username}
                            </span>
                            {p.id === user?.id && (
                              <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-bold uppercase tracking-tighter border border-white/10 shrink-0">{t('scoreboard.you')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-8">
                      <div className="flex flex-col xl:flex-row items-center justify-end gap-6 xl:gap-8">
                        
                        {/* Seeker Stats Div */}
                        {(totalGuesses > 0) && (
                          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 p-5 rounded-2xl bg-white/[0.02] border border-glassBorder/30 group-hover:border-primary/30 transition-all w-full xl:w-auto">
                            <div className="flex flex-col items-center">
                              <span className="text-2xl font-black text-white leading-none mb-1">{p.incorrect_ai || 0}</span>
                              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold text-center">{t('scoreboard.tricked_ai')}</span>
                            </div>
                            <div className="w-px h-6 bg-glassBorder hidden md:block"></div>
                            <div className="flex flex-col items-center">
                              <span className="text-2xl font-black text-white leading-none mb-1">{p.incorrect_human || 0}</span>
                              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold text-center">{t('scoreboard.tricked_human')}</span>
                            </div>
                            <div className="w-px h-6 bg-glassBorder hidden md:block"></div>
                            <div className="flex flex-col items-center">
                              <span className="text-2xl font-black text-white leading-none mb-1">{p.correct_guesses}</span>
                              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold text-center">{t('scoreboard.correct')}</span>
                            </div>
                            <div className="w-px h-8 bg-glassBorder hidden md:block"></div>
                            <div className="flex flex-col items-end">
                              <span className="text-3xl font-black text-primary leading-none mb-1">{accuracy}%</span>
                              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">{t('scoreboard.accuracy')}</span>
                            </div>
                          </div>
                        )}

                        {/* Deceiver Stats Div */}
                        {(totalTricks > 0) && (
                          <div className="flex items-center justify-center gap-6 md:gap-10 p-5 rounded-2xl bg-white/[0.02] border border-glassBorder/30 group-hover:border-secondary/30 transition-all w-full xl:w-auto">
                            <div className="flex flex-col items-center">
                              <span className="text-2xl font-black text-white leading-none mb-1">{p.tricked_users}</span>
                              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">{t('scoreboard.fooled')}</span>
                            </div>
                            <div className="w-px h-6 bg-glassBorder"></div>
                            <div className="flex flex-col items-center">
                              <span className="text-2xl font-black text-white leading-none mb-1">{p.failed_to_trick}</span>
                              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">{t('scoreboard.exposed')}</span>
                            </div>
                            <div className="w-px h-8 bg-glassBorder"></div>
                            <div className="flex flex-col items-end">
                              <span className="text-3xl font-black text-secondary leading-none mb-1">{deceptionRate}%</span>
                              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">{t('scoreboard.deception')}</span>
                            </div>
                          </div>
                        )}

                        {/* Empty Space filler if no stats */}
                        {totalGuesses === 0 && totalTricks === 0 && (
                          <span className="text-xs text-gray-600 italic tracking-wider uppercase py-4">{t('scoreboard.no_data')}</span>
                        )}

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
