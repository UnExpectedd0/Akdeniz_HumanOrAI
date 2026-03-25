import React, { useState, useEffect } from 'react';
import socket from '../services/socket';
import api from '../services/api';
import { Send, CheckCircle, XCircle, BrainCircuit, User } from 'lucide-react';

export default function AskQuestion() {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [pending, setPending] = useState(false);
  const [answerData, setAnswerData] = useState(null);
  const [guessResult, setGuessResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const user = JSON.parse(sessionStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) return;
    if (!user.group_id) {
      window.location.href = '/group';
      return;
    }

    if (socket.connected) {
      socket.emit('join', { userId: user.id, role: user.role, groupId: user.group_id });
    }

    const onConnect = () => {
      socket.emit('join', { userId: user.id, role: user.role, groupId: user.group_id });
    };

    const onQuestionAnswered = (data) => {
      setAnswerData(data);
      setPending(false);
    };

    socket.on('connect', onConnect);
    socket.on('question_answered', onQuestionAnswered);

    return () => {
      socket.off('connect', onConnect);
      socket.off('question_answered', onQuestionAnswered);
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
      setErrorMsg(err.response?.data?.error || err.message || 'An error occurred. Please check your connection.');
    } finally {
      setIsAsking(false);
    }
  };

  const handleGuess = async (guessAi) => {
    try {
      const { data } = await api.post('/game/guess', {
        answerId: answerData.answerId,
        guess_ai: guessAi
      });
      setGuessResult(data);
      const updatedUser = { ...user, score: data.newScore };
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));
      // Reload after 2s so user can read the result, then gets fresh data
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <div className="text-center mt-20 text-xl font-bold">Please login to play.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in-up relative">
      <div className="text-center space-y-3 mb-10">
        <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-md">Ask a Question</h1>
        <p className="text-xl text-gray-400 font-light">Can you tell if an AI or a Doctor answers you?</p>
      </div>

      {!pending && !answerData && !guessResult && (
        <form onSubmit={handleSubmit} className="glass p-8 rounded-3xl relative overflow-hidden group border border-glassBorder/50">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative z-10">
            {errorMsg && (
              <div className="mb-4 text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center">
                {errorMsg}
              </div>
            )}
            
            <textarea
              required
              className="w-full h-40 bg-dark/60 border border-glassBorder rounded-2xl p-6 text-white text-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all resize-none placeholder-gray-600 shadow-inner"
              placeholder="Ask anything... e.g. Why is the sky blue? Is React better than Vue? How to cure a headache?"
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                setErrorMsg('');
              }}
            />

            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={isAsking}
                className="flex items-center gap-3 bg-gradient-to-r from-primary to-secondary text-white font-bold py-3.5 px-8 rounded-xl hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isAsking ? 'Sending...' : 'Send into the void'} <Send size={20} className={isAsking ? "animate-pulse" : ""} />
              </button>
            </div>
          </div>
        </form>
      )}

      {pending && (
        <div className="glass p-16 rounded-3xl text-center space-y-8 border border-primary/20 bg-primary/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 relative mb-4">
              <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-3xl text-white font-black tracking-tight animate-pulse">Waiting for response...</h3>
            <p className="text-gray-400 text-lg mt-2">Someone (or something) is typing...</p>
          </div>
        </div>
      )}

      {answerData && !guessResult && (
        <div className="space-y-10 animate-fade-in-up">
          <div className="glass p-10 rounded-3xl border border-glassBorder relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-purple-500 to-secondary animate-pulse-slow"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 blur-[50px] rounded-full pointer-events-none"></div>
            
            <h3 className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Incoming Data Stream
            </h3>
            <p className="text-2xl text-white whitespace-pre-wrap leading-relaxed font-medium">"{answerData.text}"</p>
          </div>

          <div className="text-center space-y-8 mt-12 bg-dark/40 p-10 rounded-3xl border border-glassBorder/50 backdrop-blur-sm">
            <h2 className="text-3xl font-black text-white">Who wrote this answer?</h2>
            <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
              <button 
                onClick={() => handleGuess(true)}
                className="group relative h-40 bg-dark/80 hover:bg-dark rounded-2xl border-2 border-primary/30 hover:border-primary transition-all overflow-hidden flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-[0_0_30px_rgba(14,165,233,0.3)] hover:-translate-y-2"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-primary/0 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <BrainCircuit size={48} className="text-primary group-hover:drop-shadow-[0_0_15px_rgba(14,165,233,0.8)] transition-all" />
                <span className="relative text-2xl font-black text-primary tracking-tight">AI Generated</span>
              </button>
              
              <button 
                onClick={() => handleGuess(false)}
                className="group relative h-40 bg-dark/80 hover:bg-dark rounded-2xl border-2 border-secondary/30 hover:border-secondary transition-all overflow-hidden flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-[0_0_30px_rgba(244,63,94,0.3)] hover:-translate-y-2"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-secondary/0 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <User size={48} className="text-secondary group-hover:drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] transition-all" />
                <span className="relative text-2xl font-black text-secondary tracking-tight">Human Doctor</span>
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
            <h2 className={`text-5xl font-black tracking-tight ${guessResult.correct ? 'text-green-400' : 'text-red-400'}`}>
              {guessResult.correct ? 'Brilliant!' : 'Fooled!'}
            </h2>
            <p className="text-2xl text-gray-300">
              The answer was actually written by <strong className="text-white bg-glass px-3 py-1 rounded-lg border border-glassBorder ml-1">{guessResult.actual_was_ai ? '🤖 an AI' : '👨‍⚕️ a Human'}</strong>
            </p>
          </div>
          
          <div className="inline-block bg-dark/50 backdrop-blur-md px-6 py-4 rounded-2xl border border-glassBorder mt-6">
             <p className="text-xl text-gray-300 font-medium">
               {guessResult.correct 
                 ? <><span className="text-green-400 font-bold">+1 Point</span> for you! The answerer lost 1 point.</>
                 : <><span className="text-red-400 font-bold">You lost!</span> The answerer gained 1 point.</>}
             </p>
          </div>

          <div className="pt-10">
            <button
              onClick={() => window.location.reload()}
              className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-10 rounded-xl transition-all border border-glassBorder hover:border-white/40 hover:scale-105"
            >
              Ask Another Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
