"use client";

// Custom React states inside
import { useState, useRef, useEffect } from 'react';
import { Menu, BookOpen, ArrowUp, Zap, MessageSquare, Database, StickyNote, ChevronDown } from 'lucide-react';

const PERSONAS = [
  { id: 'jung', name: 'Carl Jung', role: 'Analitik Psikolog', color: 'border-yellow-600/50' },
  { id: 'sokrates', name: 'Sokrates', role: 'Yol Gösterici', color: 'border-blue-600/50' },
  { id: 'spinoza', name: 'Spinoza', role: 'Rasyonel Töz', color: 'border-green-600/50' },
  { id: 'schopenhauer', name: 'Schopenhauer', role: 'Kötümser Bilge', color: 'border-purple-600/50' }
];

export default function ChatPage() {
  const [activePersona, setActivePersona] = useState('jung');
  const [currentView, setCurrentView] = useState('chat'); // 'chat' | 'database' | 'notes'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [myInput, setMyInput] = useState('');
  
  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const append = async (msg: any, options: any) => {
    const userMsg = { ...msg, id: Date.now().toString() + 'user' };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, persona: options.body.persona })
      });

      if (!res.ok) {
        const errorText = await res.text();
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Sistem Hatası: ' + errorText }]);
        return;
      }

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamedResponse = '';

      setMessages(prev => [...prev, { id: Date.now().toString() + 'bot', role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        streamedResponse += chunk;

        setMessages(prev => {
          const newMsgList = [...prev];
          newMsgList[newMsgList.length - 1] = { ...newMsgList[newMsgList.length - 1], content: streamedResponse };
          return newMsgList;
        });
      }

      if (!streamedResponse.trim()) {
        setMessages(prev => {
          const newMsgList = [...prev];
          newMsgList[newMsgList.length - 1] = { ...newMsgList[newMsgList.length - 1], content: '⚠️ Groq Sunucusundan yanıt alınamadı. Büyük ihtimalle .env.local içerisindeki GROQ_API_KEY geçersiz/eksik veya limit aşımı yaşandı.' };
          return newMsgList;
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Beklenmeyen hata oluştu.' }]);
    } finally {
      setIsLoading(false);
    }
  };
  // Auto-scroll on new messages for chat view
  useEffect(() => {
    if (currentView === 'chat') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentView]);

  const currentPersonaData = PERSONAS.find(p => p.id === activePersona);

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-800 transition-transform duration-300 md:relative md:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 h-full flex flex-col">
          
          {/* Logo */}
          <div className="flex items-center gap-3 text-amber-500 mb-6 px-2">
            <BookOpen size={24} />
            <h1 className="text-xl font-serif text-zinc-100 font-bold tracking-wider">Hermetik</h1>
          </div>
          
          {/* Persona Dropdown */}
          <div className="mb-8">
            <label className="text-[10px] text-zinc-500 font-semibold tracking-widest uppercase mb-3 block px-2">Karakter Seçimi</label>
            <div className="px-2">
              <div className="relative group">
                <select 
                  value={activePersona}
                  onChange={(e) => setActivePersona(e.target.value)}
                  className="w-full appearance-none bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-200 py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all cursor-pointer font-medium"
                >
                  {PERSONAS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-500 group-hover:text-zinc-300 transition-colors">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Navigation Menu */}
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] text-zinc-500 font-semibold tracking-widest uppercase mb-2 px-2 mt-2">Menü</div>
            
            <button 
              onClick={() => { setCurrentView('chat'); setIsSidebarOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentView === 'chat' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            >
              <MessageSquare size={18} className={currentView === 'chat' ? 'text-amber-500' : ''} /> 
              <span className="font-medium text-sm">Sohbet</span>
            </button>
            
            <button 
              onClick={() => { setCurrentView('database'); setIsSidebarOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentView === 'database' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            >
              <Database size={18} className={currentView === 'database' ? 'text-amber-500' : ''} /> 
              <span className="font-medium text-sm">Veritabanı (RAG)</span>
            </button>
            
            <button 
              onClick={() => { setCurrentView('notes'); setIsSidebarOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentView === 'notes' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            >
              <StickyNote size={18} className={currentView === 'notes' ? 'text-amber-500' : ''} /> 
              <span className="font-medium text-sm">Notlarım</span>
            </button>
          </div>

          <div className="mt-auto pt-6 border-t border-zinc-800/50 text-[11px] text-zinc-500 flex items-center justify-center gap-2">
            <Zap size={14} className="text-amber-500" /> Vercel Cloud Edition
          </div>
        </div>
      </div>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full bg-zinc-950 relative w-full">
        
        {/* Header */}
        <header className="h-16 flex items-center px-4 border-b border-zinc-900 shrink-0 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10 w-full">
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-zinc-400 hover:text-zinc-100 mr-2 transition-colors">
            <Menu size={24} />
          </button>
          <div className="font-serif text-lg text-zinc-200 flex items-center gap-2">
            {currentView === 'chat' && <>{currentPersonaData?.name} <span className="text-zinc-600 text-sm font-sans font-normal ml-2">({currentPersonaData?.role})</span></>}
            {currentView === 'database' && "Veritabanı Yönetimi"}
            {currentView === 'notes' && "Kişisel Çalışma Notları"}
          </div>
        </header>

        {/* --- DYNAMIC VIEWS --- */}

        {/* 1. CHAT VIEW */}
        {currentView === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide">
              {(!messages || messages.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-700">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800/80 flex flex-col items-center justify-center mb-6 text-amber-500 shadow-lg shadow-amber-500/5">
                    <BookOpen size={28} />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-serif text-zinc-200 mb-3">Kütüphane Açık</h2>
                  <p className="text-zinc-500 max-w-md leading-relaxed">
                    Şu an <strong className="text-zinc-300">{currentPersonaData?.name}</strong> ile birliktesin. Düşüncelerini, sorularını veya analizlerini paylaşmaktan çekinme.
                  </p>
                </div>
              ) : (
                messages.map((m: any) => (
                  <div key={m.id} className={`flex max-w-4xl mx-auto w-full gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role !== 'user' && (
                      <div className={`w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs shrink-0 mt-1 font-bold text-zinc-300 border ${currentPersonaData?.color}`}>
                        {currentPersonaData?.name.charAt(0)}
                      </div>
                    )}
                    
                    <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm border border-zinc-700' : 'bg-transparent text-zinc-300'}`}>
                      {(m.content || m.parts?.[0]?.text || '').split('\n').map((line: string, i: number) => (
                        <span key={i}>{line}<br/></span>
                      ))}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="max-w-4xl mx-auto flex gap-4 animate-pulse">
                   <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0 border border-zinc-700" />
                   <div className="h-4 w-32 bg-zinc-800 rounded mt-2" />
                </div>
              )}
              <div ref={bottomRef} className="h-4" />
            </div>

            {/* Chat Input Area */}
            <div className="p-4 md:p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent shrink-0">
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!myInput.trim()) return;
                append({ role: 'user', content: myInput }, { body: { persona: activePersona } });
                setMyInput('');
              }} className="relative max-w-4xl mx-auto">
                <input
                  value={myInput}
                  onChange={(e) => setMyInput(e.target.value)}
                  disabled={isLoading}
                  placeholder={`${currentPersonaData?.name} sana yanıt vermeye hazır...`}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-6 pr-14 py-4 text-zinc-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-zinc-600 shadow-xl shadow-black/20"
                />
                <button
                  type="submit"
                  disabled={isLoading || !myInput.trim()}
                  className="absolute right-2 top-2 p-2 rounded-full bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 transition-colors shadow-sm"
                >
                  <ArrowUp size={20} className="stroke-[2.5]" />
                </button>
              </form>
            </div>
          </>
        )}

        {/* 2. DATABASE VIEW */}
        {currentView === 'database' && (
          <div className="flex-1 p-6 md:p-10 overflow-y-auto animate-in fade-in duration-300">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-amber-500">
                  <Database size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif text-zinc-100">{currentPersonaData?.name} Veritabanı</h2>
                  <p className="text-zinc-500 text-sm mt-1">Pinecone Vektör Hafızası Yönetimi</p>
                </div>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <h3 className="text-lg font-medium text-zinc-200 mb-3">Bulut Veritabanı Durumu</h3>
                <p className="text-zinc-400 leading-relaxed mb-6">
                  Bu sekme, Hermetik Kütüphane'nin RAG (Retrieval-Augmented Generation) sistemini besleyen dokümanları yönetmek için ayrılmıştır. 
                  Şu anlık salt okunur arayüzdesiniz. İlerleyen aşamalarda yeni PDF veya metin dosyalarını direkt buradan Pinecone'a yükleyebileceksiniz.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                     <div className="text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1">Bağlantı</div>
                     <div className="text-amber-500 font-medium flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                       Pinecone Aktif
                     </div>
                   </div>
                   <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                     <div className="text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1">Mevcut Namespace</div>
                     <div className="text-zinc-200 font-medium">{currentPersonaData?.id}</div>
                   </div>
                   <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                     <div className="text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1">Model Kalitesi</div>
                     <div className="text-zinc-200 font-medium">Llama-3-70B</div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. NOTES VIEW */}
        {currentView === 'notes' && (
          <div className="flex-1 p-6 md:p-10 flex flex-col items-center animate-in fade-in duration-300 relative h-full">
            <div className="w-full max-w-4xl flex-1 flex flex-col h-full">
              <div className="flex items-center gap-4 mb-6 shrink-0">
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-amber-500">
                  <StickyNote size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif text-zinc-100">Kişisel Notlar</h2>
                  <p className="text-zinc-500 text-sm mt-1">Düşüncelerini ve sentezlerini buraya kaydet</p>
                </div>
              </div>
              
              <textarea 
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Örn: Jung'un gölge arketipi ile Spinoza'nın töz kavramı arasındaki temel fark aslında..."
                className="flex-1 w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 resize-none transition-all placeholder:text-zinc-600 shadow-inner"
              />
              <div className="text-right text-xs text-zinc-500 mt-3 shrink-0">
                Notlar şu an tarayıcı hafızasında tutulmaktadır. (Supabase entegrasyonu aşamasında buluta aktarılacak)
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
