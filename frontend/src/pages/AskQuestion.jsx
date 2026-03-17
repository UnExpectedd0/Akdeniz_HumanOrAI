import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { Send, CheckCircle, XCircle } from 'lucide-react';

export default function AskQuestion() {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [pending, setPending] = useState(false);
  const [answerData, setAnswerData] = useState(null);
  const [guessResult, setGuessResult] = useState(null);
  
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) return;

    const socket = io('http://localhost:5000');
    
    socket.on('connect', () => {
      socket.emit('join', { userId: user.id, role: user.role });
    });

    socket.on('question_answered', (data) => {
      setAnswerData(data);
      setPending(false);
    });

    return () => socket.disconnect();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsAsking(true);
    try {
      await api.post('/game/ask', { text: question });
      setPending(true);
      setQuestion('');
      setAnswerData(null);
      setGuessResult(null);
    } catch (err) {
      console.error(err);
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
      // Update local storage score
      const updatedUser = { ...user, score: data.newScore };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      // Trigger a global reload or state update for navbar (quick hack: window event or reload, but we'll let it be for now)
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <div className="text-center mt-20 text-xl font-bold">Please login to play.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-white">Ask a Question</h1>
        <p className="text-gray-400">Can you tell if a human or an AI answers you?</p>
      </div>

      {!pending && !answerData && !guessResult && (
        <form onSubmit={handleSubmit} className="glass p-6 rounded-2xl relative">
          <textarea
            required
            className="w-full h-32 bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-colors resize-none placeholder-gray-500"
            placeholder="Type anything... e.g., Why is the sky blue? Is React better than Vue? How to cure a headache?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={isAsking}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white font-bold py-2 px-6 rounded-full hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all disabled:opacity-50"
            >
              {isAsking ? 'Sending...' : 'Send Question'} <Send size={18} />
            </button>
          </div>
        </form>
      )}

      {pending && (
        <div className="glass p-12 rounded-2xl text-center space-y-6 animate-pulse">
          <div className="inline-block w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <h3 className="text-2xl text-white font-bold">Waiting for an answer...</h3>
          <p className="text-gray-400">Either an AI or a Doctor is thinking about your question right now.</p>
        </div>
      )}

      {answerData && !guessResult && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="glass p-8 rounded-2xl border border-primary/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
            <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-4">You received an answer:</h3>
            <p className="text-xl text-white whitespace-pre-wrap leading-relaxed">"{answerData.text}"</p>
          </div>

          <div className="text-center space-y-6 mt-8">
            <h2 className="text-2xl font-bold text-white">Who wrote this answer?</h2>
            <div className="flex justify-center gap-6">
              <button 
                onClick={() => handleGuess(true)}
                className="group relative px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl border-2 border-primary/50 hover:border-primary transition-all overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                <span className="relative text-xl font-bold text-primary">🤖 It was an AI</span>
              </button>
              
              <button 
                onClick={() => handleGuess(false)}
                className="group relative px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl border-2 border-secondary/50 hover:border-secondary transition-all overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-secondary/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                <span className="relative text-xl font-bold text-secondary">👨‍⚕️ It was a Human</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {guessResult && (
        <div className="glass p-8 rounded-2xl text-center space-y-6">
          <div className="flex justify-center mb-4">
            {guessResult.correct ? (
              <CheckCircle size={64} className="text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
            ) : (
              <XCircle size={64} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            )}
          </div>
          
          <h2 className={`text-4xl font-black ${guessResult.correct ? 'text-green-400' : 'text-red-400'}`}>
            {guessResult.correct ? 'Correct!' : 'Wrong!'}
          </h2>
          
          <p className="text-xl text-gray-300">
            The answer was actually written by <strong className="text-white">{guessResult.actual_was_ai ? 'an AI' : 'a Human Doctor'}</strong>.
          </p>
          
          <p className="text-lg text-gray-400">
            {guessResult.correct ? "You earned 1 point! The answerer lost 1 point." : "The answerer fooled you and gained 1 point!"}
          </p>

          <div className="pt-6 border-t border-gray-800">
            <button
              onClick={() => {
                setAnswerData(null);
                setGuessResult(null);
              }}
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-full transition-colors"
            >
              Ask Another Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
