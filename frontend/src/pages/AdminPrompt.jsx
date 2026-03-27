import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Save, RefreshCw, AlertCircle, CheckCircle, FlaskConical, SendHorizonal, Eye, EyeOff, KeyRound } from 'lucide-react';
import api from '../services/api';

export default function AdminPrompt() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');

  const [content, setContent] = useState('');
  const [lastUpdatedBy, setLastUpdatedBy] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  // Doctor secret state
  const [doctorSecret, setDoctorSecret] = useState(null);
  const [secretRevealed, setSecretRevealed] = useState(false);

  // Tester state
  const [testQuestion, setTestQuestion] = useState('');
  const [testResult, setTestResult] = useState(null); // { answer, isMock }
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState('');

  const handleTest = async () => {
    if (!testQuestion.trim()) return;
    setTesting(true);
    setTestResult(null);
    setTestError('');
    try {
      const res = await api.post('/admin/test', { question: testQuestion });
      setTestResult(res.data);
    } catch (err) {
      setTestError(err.response?.data?.error || 'Failed to get AI response.');
    } finally {
      setTesting(false);
    }
  };

  // Redirect non-admin users immediately
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
    }
  }, []);

  // Load current prompt
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    fetchPrompt();
    api.get('/admin/config').then(res => setDoctorSecret(res.data.doctorSecret)).catch(() => { });
  }, []);

  const fetchPrompt = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.get('/admin/prompt');
      setContent(res.data.content);
      setLastUpdatedBy(res.data.updated_by);
      setLastUpdatedAt(res.data.updated_at);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to load prompt.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/admin/prompt', { content });
      setLastUpdatedBy(res.data.prompt.updated_by);
      setLastUpdatedAt(res.data.prompt.updated_at);
      setMessage({ type: 'success', text: 'Prompt saved successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save prompt.' });
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
          <ShieldCheck size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-gray-400">Manage the system</p>
        </div>
      </div>

      {/* Doctor Secret Card */}
      <div className="mb-6 rounded-2xl border border-glassBorder bg-glass backdrop-blur-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <KeyRound size={18} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Doctor Invite Code</h2>
            <p className="text-xs text-gray-500">Share this code with doctors so they can register an account</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-xl border border-glassBorder bg-dark/60 px-4 py-3 font-mono text-sm tracking-wider text-gray-100 select-all">
            {secretRevealed ? (doctorSecret ?? '…') : '••••••••••••'}
          </div>
          <button
            onClick={() => setSecretRevealed(v => !v)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-glassBorder text-gray-400 hover:text-white hover:border-gray-500 transition-all text-sm"
          >
            {secretRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
            {secretRevealed ? 'Hide' : 'Reveal'}
          </button>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-glassBorder bg-glass backdrop-blur-md p-6 flex flex-col gap-6">

        {/* Meta info */}
        {lastUpdatedBy && (
          <div className="text-xs text-gray-500 flex gap-4">
            <span>Last saved by <span className="text-gray-300 font-semibold">{lastUpdatedBy}</span></span>
            {lastUpdatedAt && (
              <span>at <span className="text-gray-300">{new Date(lastUpdatedAt).toLocaleString()}</span></span>
            )}
          </div>
        )}

        {/* Prompt textarea */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500 animate-pulse">
            <RefreshCw size={20} className="animate-spin mr-2" />
            Loading prompt…
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full rounded-xl border border-glassBorder bg-dark/60 text-gray-100 placeholder-gray-600 p-4 text-sm font-mono resize-y focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-all"
            placeholder="Enter the AI layout prompt…"
          />
        )}

        {/* Status message */}
        {message && (
          <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg border ${message.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
            {message.type === 'success'
              ? <CheckCircle size={16} />
              : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={fetchPrompt}
            disabled={loading || saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-glassBorder hover:border-gray-500 transition-all disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !content.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/80 text-white transition-all disabled:opacity-40 shadow-lg shadow-primary/20"
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Prompt'}
          </button>
        </div>
      </div>

      {/* Prompt Tester */}
      <div className="mt-8 rounded-2xl border border-glassBorder bg-glass backdrop-blur-md p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <FlaskConical size={18} className="text-yellow-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Prompt Tester</h2>
            <p className="text-xs text-gray-500">Ask a question and see how Gemini responds with the current saved prompt</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <textarea
            value={testQuestion}
            onChange={(e) => setTestQuestion(e.target.value)}
            rows={3}
            disabled={testing}
            className="w-full rounded-xl border border-glassBorder bg-dark/60 text-gray-100 placeholder-gray-600 p-4 text-sm resize-none focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/40 transition-all disabled:opacity-50"
            placeholder="e.g. What causes a persistent headache?"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTest(); } }}
          />
          <div className="flex justify-end">
            <button
              onClick={handleTest}
              disabled={testing || !testQuestion.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-yellow-500 hover:bg-yellow-400 text-dark transition-all disabled:opacity-40 shadow-lg shadow-yellow-500/20"
            >
              {testing
                ? <><RefreshCw size={14} className="animate-spin" /> Testing…</>
                : <><SendHorizonal size={14} /> Run Test</>}
            </button>
          </div>
        </div>

        {testError && (
          <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg border bg-red-500/10 border-red-500/30 text-red-400">
            <AlertCircle size={16} />{testError}
          </div>
        )}

        {testResult && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gemini Response</span>
              {testResult.isMock && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">⚠ Mock Fallback</span>
              )}
            </div>
            <div className="rounded-xl border border-glassBorder bg-dark/80 p-4 text-sm text-gray-200 font-mono whitespace-pre-wrap leading-relaxed">
              {testResult.answer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
