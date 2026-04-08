'use client';

import { useState } from 'react';

interface Ajuste {
  elem: string;
  mod: string;
  desc: string;
}

export default function EmailQAPortal() {
  const [inputCode, setInputCode] = useState<string>('');
  const [outputCode, setOutputCode] = useState<string>('');
  const [resumen, setResumen] = useState<Ajuste[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleClean = async () => {
    if (!inputCode) return;
    setLoading(true);
    try {
      const res = await fetch('/api/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirtyHtml: inputCode }),
      });
      const data = await res.json();
      if (data.cleanHtml) {
        setOutputCode(data.cleanHtml);
        setResumen(data.ajustes || []);
      }
    } catch (error) { console.error("Error:", error); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8 font-sans">
      {/* HEADER */}
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-[#22d3ee] flex items-center gap-2 tracking-tighter">
            🚀 EMAIL QA PORTAL
          </h1>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Audit & Sanitization Suite</p>
        </div>
        <button 
          onClick={() => { setInputCode(''); setOutputCode(''); setResumen([]); }}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold border border-slate-700 transition-all"
        >
          Clear Results
        </button>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* TEXTAREAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="relative">
            <div className="absolute -top-3 left-6 bg-[#0f172a] px-2 text-[10px] text-slate-500 uppercase font-black tracking-widest">Input: [PASTED_CODE]</div>
            <textarea
              className="w-full h-[400px] bg-[#1e293b]/40 border-2 border-dashed border-slate-800 rounded-2xl p-6 font-mono text-xs text-cyan-50/70 outline-none resize-none"
              placeholder="Pega el código aquí..."
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
            />
          </div>
          <div className="relative">
            <div className="absolute -top-3 left-6 bg-[#0f172a] px-2 text-[10px] text-cyan-400 uppercase font-black tracking-widest">Result: [CLEAN_HTML]</div>
            <textarea
              className="w-full h-[400px] bg-[#020617] border-2 border-slate-800 rounded-2xl p-6 font-mono text-xs text-emerald-400/90 outline-none resize-none shadow-inner"
              readOnly
              value={outputCode}
              placeholder="Código limpio..."
            />
          </div>
        </div>

        {/* BOTONES */}
        <div className="flex flex-col items-center gap-6 mb-16">
          <button
            onClick={handleClean}
            disabled={loading || !inputCode}
            className="w-full max-w-xl bg-white hover:bg-cyan-50 text-slate-900 py-5 rounded-2xl font-black text-xl shadow-2xl transition-all uppercase tracking-tighter disabled:opacity-30"
          >
            {loading ? '⚡ ANALYZING...' : '⚡ ANALYZE AND CLEAN CODE'}
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(outputCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            disabled={!outputCode}
            className={`px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg ${
              copied ? 'bg-emerald-500 text-white' : 'bg-[#ff40ff] text-white hover:scale-105'
            }`}
          >
            {copied ? '✓ CODE COPIED' : '📋 COPY CLEAN CODE'}
          </button>
        </div>

        {/* REPORTE DE AUDITORÍA */}
        {resumen.length > 0 && (
          <div className="bg-[#1e293b]/20 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Issue / Fix</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {resumen.map((item, index) => (
                  <tr key={index} className="hover:bg-cyan-500/[0.02] transition-colors">
                    <td className="px-8 py-5 text-xs font-black text-cyan-400">{item.elem}</td>
                    <td className="px-8 py-5">
                      <div className="bg-emerald-500/10 text-emerald-400 text-[9px] px-2 py-1 rounded-md font-black border border-emerald-500/20 flex items-center gap-1 w-fit">
                        ✅ PASS
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-200">{item.mod}</td>
                    <td className="px-8 py-5 text-xs text-slate-500 italic font-mono">{item.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}