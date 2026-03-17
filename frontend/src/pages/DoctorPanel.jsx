import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { Send, Clock } from 'lucide-react';

export default function DoctorPanel() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user || user.role !== 'doctor') return;

    fetchPendingQuestions();

    const socket = io('http://localhost:5000');
    
    socket.on('connect', () => {
      socket.emit('join', { userId: user.id, role: user.role });
    });

    socket.on('new_question', (question) => {
      setQuestions((prev) => [...prev, question]);
    });

    socket.on('question_removed', (data) => {
      setQuestions((prev) => prev.filter(q => q.id !== data.questionId));
      if (selectedQuestion && selectedQuestion.id === data.questionId) {
        setSelectedQuestion(null);
      }
    });

    return () => socket.disconnect();
  }, [user]);

  const fetchPendingQuestions = async () => {
    try {
      const { data } = await api.get('/game/pending-questions');
      setQuestions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim() || !selectedQuestion) return;

    setIsSubmitting(true);
    try {
      await api.post('/game/answer', {
        questionId: selectedQuestion.id,
        text: answerText
      });
      // Will be removed by socket event, but let's do it optimistically too just in case
      setQuestions((prev) => prev.filter(q => q.id !== selectedQuestion.id));
      setSelectedQuestion(null);
      setAnswerText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'doctor') {
    return <div className="text-center mt-20 text-xl font-bold text-red-400">Access Denied. Doctors only.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up">
      {/* Left sidebar: Pending questions queue */}
      <div className="col-span-1 glass rounded-2xl p-6 h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Clock className="text-secondary" /> 
          Waiting Room
          <span className="bg-secondary/20 text-secondary text-sm px-3 py-1 rounded-full ml-auto">
            {questions.length}
          </span>
        </h2>
        
        {questions.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            No pending questions. You can relax!
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <button
                key={q.id}
                onClick={() => { setSelectedQuestion(q); setAnswerText(''); }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedQuestion?.id === q.id 
                    ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="font-semibold text-white line-clamp-2 mb-2">"{q.text}"</div>
                <div className="text-xs text-gray-400">
                  Asked by: {q.author?.username || 'Player'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right area: Answer Editor */}
      <div className="col-span-2 glass rounded-2xl p-8 flex flex-col h-[80vh]">
        {selectedQuestion ? (
          <>
            <div className="mb-6 p-6 bg-gray-900/50 rounded-xl border border-gray-700">
              <h3 className="text-sm font-bold tracking-widest text-primary uppercase mb-2">Patient's Question</h3>
              <p className="text-xl text-white">{selectedQuestion.text}</p>
            </div>

            <form onSubmit={handleAnswer} className="flex flex-col flex-grow">
              <textarea
                required
                className="flex-grow w-full bg-gray-900/80 border border-gray-700 rounded-xl p-6 text-white text-lg focus:outline-none focus:border-secondary transition-colors resize-none placeholder-gray-500"
                placeholder="Write your diagnostic or factual answer here. Keep in mind: they are trying to guess if you are a human or an AI! Play the mind game."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
              />
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-gradient-to-r from-secondary to-primary text-white font-bold py-3 px-8 rounded-full hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all disabled:opacity-50 text-lg"
                >
                  {isSubmitting ? 'Sending...' : 'Submit Answer'} <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <Clock size={64} className="mb-4 opacity-50" />
            <p className="text-xl">Select a question from the waiting room to answer</p>
          </div>
        )}
      </div>
    </div>
  );
}
