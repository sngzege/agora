"use client";

import { useState, useRef, useEffect } from 'react';
import { Menu, BookOpen, ArrowUp, Zap, MessageSquare, Database, Settings2, ChevronDown } from 'lucide-react';

const PERSONAS = [
  { id: 'jung', name: 'Carl Jung', role: 'Analitik Psikolog' },
  { id: 'sokrates', name: 'Sokrates', role: 'Yol Gösterici' },
  { id: 'spinoza', name: 'Spinoza', role: 'Rasyonel Töz' },
  { id: 'schopenhauer', name: 'Schopenhauer', role: 'Kötümser Bilge' }
];

const BASE_RULES = `\n\nKESİN KURALLAR (BUNLARA UYMAZSAN SİSTEM ÇÖKER):
1. SEN BİR MAKALE VEYA DENEME YAZMIYORSUN. Karşılıklı, canlı ve tempolu bir felsefi SOHBET/DİYALOGDASIN.
2. CEVAPLARIN ÇOK KISA OLMALI (En fazla 3-5 cümle). Asla aynı kelimeleri/kavramları tekrar etme. Fikrinin özünü süzerek ver.
3. ÖNCE SANA GELEN SORUYU KENDİ FELSEFİ SİSTEMİNLE ASİLTÇE YANITLA. Argümanını net koy! Tüm cevabını sadece sorulardan OLUŞTURAMAZSIN. Bu YASAKTIR.
4. Yanıtını bitirdikten sonra, SADECE EN SON CÜMLENDE karşı tarafın fikrini deşecek, onu düşünmeye itecek TEK BİR SORU sorarak sözü ona at.
5. "Özetle, Bana göre, Umarım yardımcı olmuştur" gibi asistan kalıplarını KESİNLİKLE kullanma.\nKAYNAK BİLGİ: [Bulut hafıza eklenecek]`;

const DEFAULT_PROMPTS: Record<string, string> = {
  jung: `Sen Carl Gustav Jung'sun. Arketipler ve bilinçdışı üzerinden konuş. Gelen düşünceyi analitik ve mitolojik/rüya benzeri bir dille kendi konseptlerine dayanarak iddialıca analiz et. Analizini bitirdikten sonra, sadece tek bir kışkırtıcı soruyla kişinin ruhsal karanlığına (gölgesine) dokunarak diyaloğu ona devret.` + BASE_RULES,
  sokrates: `Sen Atinalı Sokrates'sin. Gelen argümanı aklın süzgecinden geçirip ironik bir dille parçalarına ayırarak analiz et. Asla bütün doğruları sen verme. Tespitini yaptıktan sonra, sadece ve sadece tek bir ardışık soru ile onun kendi bilgisizliğiyle yüzleşmesini sağla.` + BASE_RULES,
  spinoza: `Sen Baruch Spinoza'sın. Her şeyi 'Deus sive Natura' (Tanrı/Doğa) zorunluluğu içinde rasyonelce açıkla. Gelen fikri, Ethica'daki geometrik ve mutlak akılcı perspektifle soğukkanlıca yanıtla. Görüşünü 3 cümlede koyduktan sonra, sadece en son cümlen ile karşındakinin özgür irade veya hayal gücü yanılgısını paramparça edecek iğneleyici tek bir soru sor.` + BASE_RULES,
  schopenhauer: `Sen Arthur Schopenhauer'sin. Gelen düşünceye veya soruya alaycı, karamsar ve insan aklını küçümseyen cinsten, İrade'nin (Will) anlamsızlığını gösteren sert bir iddia ile net ve felsefi bir yanıt ver. Cevabını tamamlarken, karşındakinin son kalan iyimserliğini de sarsacak acımasız ve düşündürücü tek bir soru yönelt.` + BASE_RULES
};

export default function ChatPage() {
  const [activePersona, setActivePersona] = useState('spinoza');
  const [currentView, setCurrentView] = useState('chat'); // 'chat' | 'database' | 'instructions'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [myInput, setMyInput] = useState('');
  
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>(DEFAULT_PROMPTS);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (currentView === 'chat') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentView, isThinking]);

  const append = async (msg: any, options: any) => {
    const userMsg = { ...msg, id: Date.now().toString() + 'user' };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);
    setIsThinking(true);

    // Dynamic Pacing: Artificial thinking delay based on input string length!
    const charsCount = msg.content.length;
    const delayMs = Math.min(3500, 800 + (charsCount * 15));
    await new Promise(r => setTimeout(r, delayMs));
    setIsThinking(false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages, 
          persona: options.body.persona,
          customSystemPrompt: customPrompts[options.body.persona]
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: '>>> Sistem Hatası: ' + errorText }]);
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
          newMsgList[newMsgList.length - 1] = { ...newMsgList[newMsgList.length - 1], content: '⚠️ Groq Sunucusundan yanıt alınamadı. Limit aşımı yaşandı veya hata oluştu.' };
          return newMsgList;
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Beklenmeyen ağ hatası oluştu.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPersonaData = PERSONAS.find(p => p.id === activePersona);

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden font-sans relative selection:bg-amber-500/20 selection:text-amber-200">
      
      {/* Deep Atmosphere Effects */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.02] mix-blend-screen" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      <div className="pointer-events-none fixed inset-0 z-40 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
      
      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0d0d0d] border-r border-[#222] transition-transform duration-300 md:relative md:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 h-full flex flex-col relative z-50">
          
          {/* Logo */}
          <div className="flex items-center gap-3 text-amber-500/90 mb-8 px-2 mt-2">
            <BookOpen size={22} />
            <h1 className="text-xl font-serif text-zinc-100 font-bold tracking-widest lowercase">agora</h1>
          </div>
          
          {/* Persona Dropdown */}
          <div className="mb-10">
            <label className="text-[10px] text-zinc-400 font-bold tracking-[0.2em] uppercase mb-3 block px-2">Zihin Seçimi</label>
            <div className="px-2">
              <div className="relative group">
                <select 
                  value={activePersona}
                  onChange={(e) => setActivePersona(e.target.value)}
                  className="w-full appearance-none bg-[#141414] border border-[#333] hover:border-[#444] text-zinc-100 py-3 pl-4 pr-10 rounded-lg focus:outline-none focus:border-amber-500/50 transition-all cursor-pointer font-serif text-sm tracking-wide"
                >
                  {PERSONAS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-500 group-hover:text-amber-500/70 transition-colors">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <div className="flex flex-col gap-1">
            <div className="text-[10px] text-zinc-400 font-bold tracking-[0.2em] uppercase mb-3 px-2 mt-2">Sistem</div>
            
            <button 
              onClick={() => { setCurrentView('chat'); setIsSidebarOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${currentView === 'chat' ? 'bg-[#1a1a1a] text-amber-500 text-shadow-sm' : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1a1a]'}`}
            >
              <MessageSquare size={16} /> 
              <span className="font-medium text-[13px] tracking-wide">Diyalektik</span>
            </button>

            <button 
              onClick={() => { setCurrentView('instructions'); setIsSidebarOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${currentView === 'instructions' ? 'bg-[#1a1a1a] text-amber-500 text-shadow-sm' : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1a1a]'}`}
            >
              <Settings2 size={16} /> 
              <span className="font-medium text-[13px] tracking-wide">Karakter Kuralları</span>
            </button>
            
            <button 
              onClick={() => { setCurrentView('database'); setIsSidebarOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${currentView === 'database' ? 'bg-[#1a1a1a] text-amber-500 text-shadow-sm' : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1a1a]'}`}
            >
              <Database size={16} /> 
              <span className="font-medium text-[13px] tracking-wide">Bulut Hafıza (RAG)</span>
            </button>
          </div>

          <div className="mt-auto pt-6 border-t border-[#222] text-[10px] text-zinc-500 flex items-center justify-center gap-2 font-mono uppercase tracking-widest">
            <Zap size={12} className="text-amber-500/70" /> Vercel Deploy Ready
          </div>
        </div>
      </div>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full relative z-30">
        
        {/* Header */}
        <header className="h-20 flex items-center px-6 shrink-0 sticky top-0 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10 w-full mb-4">
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-zinc-400 hover:text-zinc-100 mr-2 transition-colors">
            <Menu size={20} />
          </button>
          <div className="font-serif text-xl tracking-wide text-zinc-300 opacity-80">
            {currentView === 'chat' && currentPersonaData?.name}
            {currentView === 'instructions' && "Talimat Yönetimi"}
            {currentView === 'database' && "Vektör Veritabanı"}
          </div>
        </header>

        {/* --- DYNAMIC VIEWS --- */}

        {/* 1. CHAT VIEW */}
        {currentView === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto px-4 md:px-12 pb-10 space-y-12 scrollbar-hide">
              {(!messages || messages.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 fade-in duration-1000 opacity-60">
                  <h2 className="text-3xl md:text-5xl font-serif text-zinc-300 mb-4 tracking-wider">{currentPersonaData?.name}</h2>
                  <p className="text-zinc-400 max-w-sm uppercase text-[10px] tracking-[0.3em] font-bold">{currentPersonaData?.role}</p>
                </div>
              ) : (
                messages.map((m: any) => (
                  <div key={m.id} className={`flex w-full ${m.role === 'user' ? 'justify-end pl-12' : 'justify-start pr-12'}`}>
                    {/* User */}
                    {m.role === 'user' && (
                      <div className="text-[14px] text-zinc-300 font-serif italic text-right leading-relaxed max-w-xl bg-[#141414]/50 border border-[#222] p-4 rounded-xl">
                        "{m.content}"
                      </div>
                    )}
                    
                    {/* Bot */}
                    {m.role !== 'user' && (
                      <div className="text-[17px] md:text-[20px] text-zinc-50 font-serif leading-[1.8] max-w-3xl tracking-wide drop-shadow-md">
                        {(m.content || m.parts?.[0]?.text || '').split('\n').map((line: string, i: number) => (
                          <span key={i}>{line}<br/><br/></span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {/* Artificial Thinking Pacing State */}
              {isThinking && (
                 <div className="flex w-full justify-start fade-in opacity-80">
                    <div className="text-[16px] text-zinc-400 font-serif italic flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse"></span>
                       {currentPersonaData?.name} düşünüyor...
                    </div>
                 </div>
              )}
              {isLoading && !isThinking && (
                <div className="flex w-full justify-start animate-pulse opacity-40">
                    <div className="h-4 w-4 rounded-full bg-zinc-200" />
                </div>
              )}
              <div ref={bottomRef} className="h-24" />
            </div>

            {/* Chat Input Area */}
            <div className="p-4 md:p-8 shrink-0 relative bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent">
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!myInput.trim()) return;
                append({ role: 'user', content: myInput }, { body: { persona: activePersona } });
                setMyInput('');
              }} className="relative max-w-3xl mx-auto">
                <input
                  value={myInput}
                  onChange={(e) => setMyInput(e.target.value)}
                  disabled={isLoading}
                  placeholder="Zihnine bir soru bırak..."
                  className="w-full bg-[#141414]/90 backdrop-blur-md border border-[#333] rounded-xl pl-6 pr-14 py-4 text-zinc-50 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all placeholder:text-zinc-500 shadow-[0_10px_40px_rgba(0,0,0,0.8)] font-serif text-[15px] tracking-wide"
                />
                <button
                  type="submit"
                  disabled={isLoading || !myInput.trim()}
                  className="absolute right-3 top-3 p-2 rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black disabled:opacity-0 disabled:hover:bg-transparent transition-all"
                >
                  <ArrowUp size={18} />
                </button>
              </form>
            </div>
          </>
        )}

        {/* 2. INSTRUCTIONS / SYSTEM PROMPT CONFIG VIEW */}
        {currentView === 'instructions' && (
          <div className="flex-1 p-6 md:px-12 md:py-8 overflow-y-auto fade-in h-full flex flex-col">
            <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col">
              <div className="mb-8">
                <h2 className="text-3xl font-serif text-zinc-50">{currentPersonaData?.name} Kuralları</h2>
                <p className="text-zinc-400 text-xs mt-2 font-mono uppercase tracking-widest font-bold">Sistem Zihni Manipülasyon Paneli</p>
              </div>
              
              <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl flex-1 flex flex-col overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative">
                 <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between text-zinc-400 text-xs font-mono uppercase bg-[#141414]">
                   <span>system_prompt_engine.ts</span>
                   <span className="text-amber-500/80 flex items-center gap-2 font-bold"><div className="w-1.5 h-1.5 rounded-full bg-amber-500/80 animate-pulse"/> LIVE EDIT</span>
                 </div>
                 <textarea 
                    value={customPrompts[activePersona]}
                    onChange={(e) => {
                       setCustomPrompts({...customPrompts, [activePersona]: e.target.value})
                    }}
                    spellCheck="false"
                    className="flex-1 w-full bg-black/20 p-6 text-zinc-200 font-mono text-sm leading-[1.9] focus:outline-none resize-none scrollbar-hide shadow-inner"
                 />
              </div>
              
              <p className="text-zinc-400 text-[12px] mt-4 text-center tracking-wide">
                * Yapacağınız değişiklikler anında kaydedilir ve sohbete gönderilen bir sonraki mesajın bağlamını kökten değiştirir. Kırmızı şalter elinizde.
              </p>
            </div>
          </div>
        )}

        {/* 3. DATABASE (RAG) VIEW Placeholder */}
        {currentView === 'database' && (
          <div className="flex-1 p-6 md:p-12 fade-in">
             <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-full text-center opacity-60 mt-20">
                <Database size={48} className="text-zinc-400 mb-6" />
                <h2 className="text-3xl font-serif text-zinc-200 mb-4 tracking-widest uppercase">Bulut Hafızası Bekleniyor</h2>
                <p className="text-zinc-400 max-w-md font-mono text-[13px] leading-loose">
                  İlerleyen aşamada Pinecone API anahtarları tanımlandığında ve Python ingest betiği çalıştırıldığında, {currentPersonaData?.name}'un PDF dokümanları bu ekranda yönetilecektir.
                </p>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
