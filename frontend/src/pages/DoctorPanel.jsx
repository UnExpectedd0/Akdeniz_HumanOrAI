import React, { useEffect, useState } from 'react';
import socket from '../services/socket';
import api from '../services/api';
import { Send, Clock, Activity, AlertCircle, CheckCircle, ShieldAlert, Lock } from 'lucide-react';

export default function DoctorPanel() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  
  // AI Status tracking
  const [aiStatus, setAiStatus] = useState(null);

  const user = JSON.parse(sessionStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user || user.role !== 'doctor') return;
    if (!user.group_id) {
      window.location.href = '/group';
      return;
    }

    fetchPendingQuestions();

    if (socket.connected) {
      socket.emit('join', { userId: user.id, role: user.role, groupId: user.group_id });
    }

    const onConnect = () => {
      socket.emit('join', { userId: user.id, role: user.role, groupId: user.group_id });
    };

    const onNewQuestion = (question) => {
      setQuestions((prev) => [...prev, question]);
    };

    const onQuestionRemoved = (data) => {
      setQuestions((prev) => prev.filter(q => q.id !== data.questionId));
      setSelectedQuestion(prev => (prev && prev.id === data.questionId ? null : prev));
    };

    const onGroupUpdated = () => {
      fetchPendingQuestions();
    };

    const onQuestionUpdated = () => fetchPendingQuestions();

    socket.on('connect', onConnect);
    socket.on('new_question', onNewQuestion);
    socket.on('question_removed', onQuestionRemoved);
    socket.on('question_updated', onQuestionUpdated);
    socket.on('group_updated', onGroupUpdated);

    fetchAiStatus();
    const aiInterval = setInterval(fetchAiStatus, 10000);

    return () => {
      socket.off('connect', onConnect);
      socket.off('new_question', onNewQuestion);
      socket.off('question_removed', onQuestionRemoved);
      socket.off('question_updated', onQuestionUpdated);
      socket.off('group_updated', onGroupUpdated);
      clearInterval(aiInterval);
    };
  }, []);

  const fetchAiStatus = async () => {
    try {
      const res = await api.get('/game/ai-status');
      setAiStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch AI status');
    }
  };

  const fetchPendingQuestions = async () => {
    try {
      const { data } = await api.get('/game/pending-questions');
      setQuestions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async (questionId) => {
    setIsAccepting(true);
    try {
      await api.post('/game/accept-question', { questionId });
      fetchPendingQuestions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept question');
    } finally {
      setIsAccepting(false);
    }
  };

  const doctorHasAccepted = questions.some(q => q.status === 'accepted' && q.accepted_by === user.id);

  const handleAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim() || !selectedQuestion) return;

    setIsSubmitting(true);
    try {
      await api.post('/game/answer', {
        questionId: selectedQuestion.id,
        text: answerText
      });
      setSelectedQuestion(null);
      setAnswerText('');
      fetchPendingQuestions();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'doctor') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <AlertCircle size={64} className="text-red-500 animate-pulse" />
        <h2 className="text-3xl font-black text-red-500 tracking-tight">Access Denied</h2>
        <p className="text-gray-400">This sector is restricted to medical personnel only.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 mx-2 gap-4">
        <div className="pl-2 border-l-4 border-secondary">
          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">Diagnostic Terminal</h2>
          <p className="text-sm md:text-gray-400 font-light mt-1">Review incoming queries and provide human expertise.</p>
        </div>

        {/* AI Health Indicator for Doctors */}
        {aiStatus && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-dark/40 border border-glassBorder shadow-lg">
            <div className="flex -space-x-1">
              {['primary', 'secondary'].map(slot => (
                <div 
                  key={slot} 
                  className={`w-2.5 h-2.5 rounded-full border border-dark ${aiStatus[slot]?.waitSeconds > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}
                  title={`${slot} API: ${aiStatus[slot]?.waitSeconds > 0 ? 'Exhausted' : 'Ready'}`}
                />
              ))}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {Object.values(aiStatus).some(s => s.waitSeconds > 0) ? (
                <span className="text-secondary animate-pulse">AI Capacity Limited — Human Priority</span>
              ) : (
                <span>AI Systems Operational</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 lg:h-[75vh] px-2">
        {/* Left sidebar: Pending questions queue */}
        <div className="col-span-1 glass rounded-3xl p-6 h-full flex flex-col border border-glassBorder/50 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-[50px] rounded-full pointer-events-none"></div>

          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
              <Activity className="text-secondary" /> 
              Queue
            </h3>
            <span className="bg-secondary/20 border border-secondary/30 text-secondary font-black text-lg px-4 py-1 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.3)]">
              {questions.length}
            </span>
          </div>
          
          <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar relative z-10">
            {questions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 opacity-50">
                <Clock size={48} />
                <p className="text-center font-medium">No pending queries in the system.</p>
              </div>
            ) : (
              questions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => { setSelectedQuestion(q); setAnswerText(''); }}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 group ${
                    selectedQuestion?.id === q.id 
                      ? 'bg-secondary/10 border-secondary shadow-[0_0_20px_rgba(244,63,94,0.2)] scale-[1.02]' 
                      : 'bg-dark/40 border-glassBorder hover:border-gray-500 hover:bg-white/5'
                  }`}
                >
                 <div className="font-semibold text-white line-clamp-2 mb-3 leading-relaxed">"{q.text}"</div>
                  
                  <div className="flex flex-col gap-2">
                    <div className={`text-[10px] flex items-center gap-2 ${selectedQuestion?.id === q.id ? 'text-secondary font-bold' : 'text-gray-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedQuestion?.id === q.id ? 'bg-secondary' : 'bg-gray-500'}`}></div>
                      Patient ID: {q.author?.username || 'Unknown'}
                    </div>

                    {q.status === 'accepted' ? (
                      <div className="flex items-center gap-2 px-2 py-1 rounded bg-secondary/10 border border-secondary/20 text-[10px] text-secondary">
                        <CheckCircle size={10} />
                        <span>Accepted by {q.acceptor?.username === user.username ? 'You' : q.acceptor?.username}</span>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAccept(q.id); }}
                        disabled={isAccepting || doctorHasAccepted}
                        className="mt-2 w-full py-2 bg-secondary/20 hover:bg-secondary/30 disabled:opacity-30 disabled:hover:bg-secondary/20 border border-secondary/30 text-secondary text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
                      >
                        {isAccepting ? 'Processing...' : (doctorHasAccepted ? 'Finish your active task first' : 'Accept Question')}
                      </button>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2 h-full">
          {!selectedQuestion ? (
            <div className="h-full glass rounded-3xl flex flex-col items-center justify-center text-gray-500 p-10 text-center border border-glassBorder/30">
              <div className="w-20 h-20 rounded-full bg-glass border border-glassBorder flex items-center justify-center mb-6">
                <ShieldAlert size={32} className="text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Question Selected</h3>
              <p className="max-w-xs">Select a question from the queue to review and submit your official medical response.</p>
            </div>
          ) : selectedQuestion.status !== 'accepted' || selectedQuestion.accepted_by !== user.id ? (
            <div className="h-full glass rounded-3xl flex flex-col items-center justify-center text-gray-500 p-10 text-center border border-glassBorder/30">
              <div className="w-20 h-20 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-6">
                <Lock size={32} className="text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Action Required</h3>
              <p className="max-w-xs">You must <strong>Accept</strong> this question before you can provide an answer.</p>
              {selectedQuestion.status === 'accepted' && (
                <p className="mt-4 text-secondary/80 text-sm italic font-medium">
                  Currently being handled by Dr. {selectedQuestion.acceptor?.username || 'another specialist'}.
                </p>
              )}
            </div>
          ) : (
            <div className="glass rounded-3xl p-8 flex flex-col h-full border border-glassBorder/50 shadow-2xl relative overflow-hidden animate-fade-in-up">
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>

              <div className="mb-4 md:mb-8 p-4 md:p-8 bg-dark/60 rounded-2xl border border-glassBorder relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary"></div>
                <h3 className="text-[10px] md:text-xs font-black tracking-[0.2em] text-primary uppercase mb-2 md:mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  Active Query Analysis
                </h3>
                <p className="text-lg md:text-2xl text-white font-medium leading-relaxed">{selectedQuestion.text}</p>
              </div>

              <form onSubmit={handleAnswer} className="flex flex-col flex-grow relative z-10">
                <div className="flex-grow relative group">
                  <div className="absolute inset-0 bg-secondary/5 blur-xl group-focus-within:bg-secondary/10 transition-colors pointer-events-none"></div>
                  <textarea
                    required
                    className="absolute inset-0 w-full h-full bg-dark/80 border border-glassBorder rounded-2xl p-6 text-white text-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all resize-none shadow-inner z-10"
                    placeholder="Enter your response here. Remember: players will try to guess if this answer was written by a human or an AI. Play strategically."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-between items-center mt-6">
                  <p className="text-sm text-gray-500 italic hidden sm:block">Transmitting data securely to central servers...</p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-3 bg-gradient-to-r from-secondary to-primary text-white font-bold py-4 px-10 rounded-xl hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isSubmitting ? 'Transmitting...' : 'Transmit Response'} <Send size={20} className={isSubmitting ? "animate-pulse" : ""} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
