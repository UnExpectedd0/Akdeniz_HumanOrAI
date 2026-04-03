import React, { useState, useEffect } from 'react';
import socket from '../services/socket';
import api from '../services/api';
import { Send, CheckCircle, XCircle, BrainCircuit, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function AskQuestion() {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [pending, setPending] = useState(false);
  const [answerData, setAnswerData] = useState(null);
  const [guessResult, setGuessResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const user = JSON.parse(sessionStorage.getItem('user') || 'null');
  const { t } = useLanguage();

  useEffect(() => {
    if (!user) return;
    if (!user.group_id) {
      window.location.href = '/group';
      return;
    }

    if (socket.connected) {
      socket.emit('join', { userId: user.id, role: user.role, groupId: user.group_id });
    }

    const fetchActive = async () => {
      try {
        const { data } = await api.get('/game/active-question');
        if (data) {
          if (data.status === 'answered' && data.answer) {
            setAnswerData({ answerId: data.answer.id, text: data.answer.text });
            setPending(false);
          } else {
            setPending(true);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchActive();

    const onConnect = () => socket.emit('join', { userId: user.id, role: user.role, groupId: user.group_id });
    const onQuestionAnswered = (data) => { setAnswerData(data); setPending(false); };
    const onQuestionAccepted = () => setPending(true);

    socket.on('connect', onConnect);
    socket.on('question_answered', onQuestionAnswered);
    socket.on('question_accepted', onQuestionAccepted);

    return () => {
      socket.off('connect', onConnect);
      socket.off('question_answered', onQuestionAnswered);
      socket.off('question_accepted', onQuestionAccepted);
    };
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!question.trim()) return;
    setIsAsking(true);
    setErrorMsg('');
    try {
      await api.post('/game/ask', { text: question });
      setPending(true);
      setQuestion('');
      setAnswerData(null);
      setGuessResult(null);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'An error occurred.');
    } finally {
      setIsAsking(false);
    }
  };

  const handleGuess = async (guessAi) => {
    try {
      const { data } = await api.post('/game/guess', { answerId: answerData.answerId, guess_ai: guessAi });
      setGuessResult(data);
      const updatedUser = { ...user, score: data.newScore };
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <div className="text-center mt-20 text-xl font-bold">Please login to play.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in-up relative">
      <div className="text-center space-y-3 mb-6 md:mb-10 px-4">
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md leading-tight">{t('ask.title')}</h1>
        <p className="text-sm md:text-xl text-gray-400 font-light">{t('ask.subtitle')}</p>
      </div>

      {!pending && !answerData && !guessResult && (
        <form onSubmit={handleSubmit} className="glass p-8 rounded-3xl relative overflow-hidden group border border-glassBorder/50">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            {errorMsg && (
              <div className="mb-4 text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center">{errorMsg}</div>
            )}
            <textarea
              required
              className="w-full h-40 bg-dark/60 border border-glassBorder rounded-2xl p-6 text-white text-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all resize-none placeholder-gray-600 shadow-inner"
              placeholder={t('ask.placeholder')}
              value={question}
              onChange={(e) => { setQuestion(e.target.value); setErrorMsg(''); }}
            />
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={isAsking}
                className="flex items-center gap-3 bg-gradient-to-r from-primary to-secondary text-white font-bold py-3.5 px-8 rounded-xl hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isAsking ? t('ask.sending') : t('ask.send')} <Send size={20} className={isAsking ? "animate-pulse" : ""} />
              </button>
            </div>
          </div>
        </form>
      )}

      {pending && (
        <div className="glass p-16 rounded-3xl text-center space-y-8 border border-primary/20 bg-primary/5 relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 relative mb-4">
              <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl md:text-3xl text-white font-black tracking-tight animate-pulse">{t('ask.waiting_title')}</h3>
            <p className="text-gray-400 text-base md:text-lg mt-2">{t('ask.waiting_desc')}</p>
          </div>
        </div>
      )}

      {answerData && !guessResult && (
        <div className="space-y-10 animate-fade-in-up">
          <div className="glass p-6 md:p-10 rounded-2xl md:rounded-3xl border border-glassBorder relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-purple-500 to-secondary animate-pulse-slow"></div>
            <h3 className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {t('ask.stream_label')}
            </h3>
            <p className="text-2xl text-white whitespace-pre-wrap leading-relaxed font-medium">"{answerData.text}"</p>
          </div>

          <div className="text-center space-y-6 md:space-y-8 mt-6 md:mt-12 bg-dark/40 p-6 md:p-10 rounded-2xl md:rounded-3xl border border-glassBorder/50 backdrop-blur-sm">
            <h2 className="text-xl md:text-3xl font-black text-white">{t('ask.who_wrote')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 max-w-2xl mx-auto">
              <button
                onClick={() => handleGuess(true)}
                className="group relative h-32 md:h-40 bg-dark/80 hover:bg-dark rounded-xl md:rounded-2xl border-2 border-primary/30 hover:border-primary transition-all overflow-hidden flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-[0_0_30px_rgba(14,165,233,0.3)]"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-primary/0 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <BrainCircuit size={40} className="text-primary group-hover:drop-shadow-[0_0_15px_rgba(14,165,233,0.8)] transition-all md:scale-125" />
                <span className="relative text-xl md:text-2xl font-black text-primary tracking-tight">{t('ask.ai_generated')}</span>
              </button>

              <button
                onClick={() => handleGuess(false)}
                className="group relative h-32 md:h-40 bg-dark/80 hover:bg-dark rounded-xl md:rounded-2xl border-2 border-secondary/30 hover:border-secondary transition-all overflow-hidden flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-secondary/0 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <User size={40} className="text-secondary group-hover:drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] transition-all md:scale-125" />
                <span className="relative text-xl md:text-2xl font-black text-secondary tracking-tight">{t('ask.human_doctor')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {guessResult && (
        <div className={`glass p-12 rounded-3xl text-center space-y-8 animate-fade-in-up border-2 ${guessResult.correct ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <div className="flex justify-center mb-6">
            {guessResult.correct ? (
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 blur-xl opacity-30 animate-pulse"></div>
                <CheckCircle size={80} className="text-green-500 relative z-10" />
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 blur-xl opacity-30 animate-pulse"></div>
                <XCircle size={80} className="text-red-500 relative z-10" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <h2 className={`text-3xl md:text-5xl font-black tracking-tight ${guessResult.correct ? 'text-green-400' : 'text-red-400'}`}>
              {guessResult.correct ? t('ask.result_correct') : t('ask.result_wrong')}
            </h2>
            <p className="text-lg md:text-2xl text-gray-300 px-4">
              {t('ask.result_was')} <strong className="text-white bg-glass px-2 md:px-3 py-1 rounded-lg border border-glassBorder whitespace-nowrap">{guessResult.actual_was_ai ? `🤖 ${t('ask.result_desc_ai')}` : `👨‍⚕️ ${t('ask.result_desc_human')}`}</strong>
            </p>
          </div>
          <div className="inline-block bg-dark/50 backdrop-blur-md px-6 py-4 rounded-2xl border border-glassBorder mt-6">
            <p className="text-xl text-gray-300 font-medium">
              {guessResult.correct
                ? <><span className="text-green-400 font-bold">{t('ask.point_gained')}</span></>
                : <><span className="text-red-400 font-bold">{t('ask.point_lost')}</span></>}
            </p>
          </div>
          <div className="pt-10">
            <button
              onClick={() => window.location.reload()}
              className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-10 rounded-xl transition-all border border-glassBorder hover:border-white/40 hover:scale-105"
            >
              {t('ask.ask_another')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
