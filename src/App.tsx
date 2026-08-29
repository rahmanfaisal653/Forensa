import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { Search, FileText, ArrowRight, Loader2, BookOpen, Target, Sparkles, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';
import { generateAnalysis } from './services/geminiService';
import { loadSettings, saveSettings, AISettings } from './services/aiClient';
import AISettingsModal from './components/AISettingsModal';

type Mode = 'forensics' | 'matchmaker';

export default function App() {
  const [mode, setMode] = useState<Mode>('forensics');
  const [journalName, setJournalName] = useState('');
  const [manuscript, setManuscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>(() => loadSettings());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalName.trim()) return;
    if (mode === 'matchmaker' && !manuscript.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const text = await generateAnalysis(mode, journalName, manuscript);
      setResult(text || 'Tidak ada respons dari sistem.');
    } catch (err: any) {
      console.error('Error generating content:', err);
      setError(err.message || 'Terjadi kesalahan saat menghubungi sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f5f5f4] text-[#0a0a0a] font-sans selection:bg-slate-200">
      {/* Left Pane: Controls */}
      <div className="w-full md:w-[45%] lg:w-[40%] xl:w-[35%] p-8 md:p-12 flex flex-col border-r border-slate-200 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 overflow-y-auto h-screen">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-md">
              <Sparkles size={20} />
            </div>
            <h1 className="text-3xl font-serif font-bold tracking-tight text-slate-900">Forensa</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">
            Journal Forensics & Matchmaker
          </p>
          <button
            onClick={() => setShowSettings(true)}
            title="Pengaturan AI (provider & model)"
            className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            <Cpu size={14} />
            Pengaturan AI
          </button>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
          <button
            onClick={() => setMode('forensics')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === 'forensics'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Search size={16} />
            Forensik
          </button>
          <button
            onClick={() => setMode('matchmaker')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === 'matchmaker'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Target size={16} />
            Matchmaker
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
          <div className="space-y-2">
            <label htmlFor="journal" className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">
              {mode === 'forensics' ? 'Nama Jurnal' : 'Jurnal Target'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <BookOpen size={18} />
              </div>
              <input
                id="journal"
                type="text"
                value={journalName}
                onChange={(e) => setJournalName(e.target.value)}
                placeholder="Contoh: Journal of Business Research"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'matchmaker' && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="space-y-2 flex-1 flex flex-col"
              >
                <label htmlFor="manuscript" className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Judul & Abstrak Manuskrip
                </label>
                <div className="relative flex-1 flex flex-col">
                  <div className="absolute top-3.5 left-3.5 text-slate-400 pointer-events-none">
                    <FileText size={18} />
                  </div>
                  <textarea
                    id="manuscript"
                    value={manuscript}
                    onChange={(e) => setManuscript(e.target.value)}
                    placeholder="Paste judul dan abstrak manuskrip Anda di sini..."
                    className="w-full h-full min-h-[200px] pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-none"
                    required={mode === 'matchmaker'}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-auto pt-6">
            <button
              type="submit"
              disabled={loading || !journalName.trim() || (mode === 'matchmaker' && !manuscript.trim())}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-900/20"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Menganalisis...
                </>
              ) : (
                <>
                  Mulai Analisis
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Right Pane: Results */}
      <div className="flex-1 h-screen overflow-y-auto bg-[#f8f9fa] relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="mb-6"
            >
              <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full" />
            </motion.div>
            <p className="font-serif italic text-lg text-slate-500">Forensa sedang membedah data...</p>
          </div>
        ) : error ? (
          <div className="p-8 md:p-16 max-w-3xl mx-auto h-full flex flex-col justify-center">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start gap-4 text-red-800">
              <AlertCircle className="shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Terjadi Kesalahan</h3>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          </div>
        ) : result ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 md:p-16 max-w-4xl mx-auto"
          >
            <div className="mb-8 pb-6 border-b border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900">
                  {mode === 'forensics' ? 'Hasil Forensik Jurnal' : 'Hasil Analisis Kesesuaian'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Analisis oleh Forensa, Chief Editor.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-10">
              <div className="markdown-body">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-24 h-24 mb-6 opacity-20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-serif text-slate-600 mb-2">Siap Menganalisis</h3>
            <p className="max-w-md text-sm leading-relaxed">
              Masukkan nama jurnal di panel sebelah kiri untuk memulai forensik, atau gunakan mode Matchmaker untuk menguji naskah Anda.
            </p>
          </div>
        )}
      </div>

      {showSettings && (
        <AISettingsModal
          settings={aiSettings}
          onSave={(s) => {
            setAiSettings(s);
            saveSettings(s);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
