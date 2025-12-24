import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Languages, 
  ArrowRightLeft, 
  Copy, 
  Trash2, 
  Check, 
  Volume2, 
  Loader2,
  Sparkles,
  Download,
  FileText
} from 'lucide-react';
import { Language } from './types';
import { DocumentGenerator } from './services/documentGenerator';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [sourceLang, setSourceLang] = useState<Language>(Language.MALAYALAM);
  const [targetLang, setTargetLang] = useState<Language>(Language.ENGLISH);
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const translate = async (text: string) => {
    if (!text.trim()) {
      setOutputText('');
      return;
    }

    setIsTranslating(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate the following text from ${sourceLang} to ${targetLang}. 
        Return ONLY the translated text without any explanations.
        Text to translate: ${text}`,
      });
      
      setOutputText(response.text || '');
    } catch (error) {
      console.error('Translation Error:', error);
      setOutputText('Error occurred during translation. Please check your connection or API key.');
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    if (inputText.trim()) {
      timeoutRef.current = setTimeout(() => {
        translate(inputText);
      }, 1000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [inputText, sourceLang, targetLang]);

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(outputText);
    setOutputText(inputText);
  };

  const clearAll = () => {
    setInputText('');
    setOutputText('');
  };

  const downloadPDF = async () => {
    if (!outputText) return;
    const blob = await DocumentGenerator.generatePDF(outputText, 'translation.pdf');
    DocumentGenerator.download(blob, 'translation.pdf');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-[#f8fafc]">
      <header className="max-w-5xl w-full mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-xl shadow-indigo-100">
            <Languages size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
              LinguBridge <span className="text-indigo-600">AI</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Malayalam Engine 2.0</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Gemini 3 Flash Active</span>
        </div>
      </header>

      <main className="max-w-5xl w-full">
        <div className="flex items-center justify-between mb-6 px-4">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Source</span>
              <span className="text-sm font-bold text-slate-700">{sourceLang}</span>
            </div>
            
            <button 
              onClick={swapLanguages}
              className="p-3 bg-white hover:bg-indigo-50 rounded-2xl transition-all border border-slate-200 shadow-sm hover:shadow-md active:scale-95 group"
            >
              <ArrowRightLeft size={18} className="text-indigo-600 group-hover:rotate-180 transition-transform duration-500" />
            </button>

            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target</span>
              <span className="text-sm font-bold text-indigo-600">{targetLang}</span>
            </div>
          </div>
          
          <button 
            onClick={clearAll}
            className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-xl border border-slate-200"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-white rounded-[2.5rem] p-8 min-h-[400px] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col group transition-all hover:border-indigo-200">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={sourceLang === Language.MALAYALAM ? 'ഇവിടെ ടൈപ്പ് ചെയ്യുക...' : 'Enter your text...'}
              className={`w-full flex-1 bg-transparent border-none focus:ring-0 resize-none text-slate-800 placeholder:text-slate-300 ${sourceLang === Language.MALAYALAM ? 'ml-font text-2xl leading-relaxed' : 'text-xl font-medium leading-relaxed'}`}
            />
            <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-4 opacity-40 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inputText.length} Characters</span>
              <Sparkles size={16} className="text-indigo-200" />
            </div>
          </div>

          {/* Output Panel */}
          <div className="bg-white/60 backdrop-blur-sm rounded-[2.5rem] p-8 min-h-[400px] shadow-xl shadow-slate-200/40 border border-white flex flex-col relative">
            {isTranslating && (
              <div className="absolute top-8 right-8 flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                <Loader2 className="animate-spin text-indigo-600" size={14} />
                <span className="text-[10px] font-bold text-indigo-600 uppercase">Processing</span>
              </div>
            )}
            
            <div className={`w-full flex-1 text-slate-800 ${targetLang === Language.MALAYALAM ? 'ml-font text-2xl leading-relaxed' : 'text-xl font-medium leading-relaxed'}`}>
              {outputText ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {outputText}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <p className="italic text-sm font-medium">Your translation will appear here</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-6 mt-4 border-t border-slate-100/50">
              <div className="flex gap-2">
                <button 
                  onClick={downloadPDF}
                  disabled={!outputText}
                  title="Export to PDF"
                  className="p-3 bg-white hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all border border-slate-100 disabled:opacity-30 shadow-sm"
                >
                  <Download size={18} />
                </button>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleCopy}
                  disabled={!outputText}
                  className={`p-3 rounded-2xl transition-all border shadow-sm ${isCopied ? 'bg-green-50 border-green-100 text-green-600' : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-400'}`}
                >
                  {isCopied ? <Check size={18} /> : <Copy size={18} />}
                </button>
                <button 
                  disabled={!outputText}
                  className="p-3 bg-white hover:bg-slate-50 text-slate-400 rounded-2xl transition-all border border-slate-100 shadow-sm disabled:opacity-30"
                >
                  <Volume2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Smart Recognition", desc: "Advanced Malayalam context analysis." },
            { title: "Flash Translation", desc: "Ultra-low latency powered by Gemini 3." },
            { title: "Export Options", desc: "Save translations as PDF or Word docs." }
          ].map((feature, i) => (
            <div key={i} className="bg-white/40 border border-slate-200/60 p-5 rounded-3xl flex flex-col items-center text-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">{feature.title}</h3>
              <p className="text-xs text-slate-500 font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="mt-auto py-10 w-full max-w-5xl flex justify-between items-center border-t border-slate-200/50">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">
          Advanced Linguistics Lab &copy; 2025
        </p>
        <div className="flex gap-6">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">Privacy</span>
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">Terms</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
