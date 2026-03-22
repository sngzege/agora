"use client";

import { useState, useRef, useEffect } from 'react';
import { Menu, BookOpen, ArrowUp, Zap, MessageSquare, Database, Settings2, ChevronDown, ChevronRight, Brain, Quote } from 'lucide-react';

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

// IDEAS FOR DATABASE-LESS CONTENT (Static Mental Library)
const APHORISMS: Record<string, { quote: string, context: string }[]> = {
  jung: [
    { quote: "Dışarıya bakan rüya görür, içeriye bakan uyanır.", context: "İçe Bakış ve Bireyleşme" },
    { quote: "Bir insan aydınlığı hayal ederek değil, karanlığın bilincine vararak aydınlanır.", context: "Gölge Arketipleri" }
  ],
  sokrates: [
    { quote: "Sorgulanmamış bir hayat, yaşanmaya değmez.", context: "Savunma (Apology)" },
    { quote: "Bildiğim tek bir şey var, o da hiçbir şey bilmediğimdir.", context: "Bilgi Epistemolojisi" }
  ],
  spinoza: [
    { quote: "Korku, ümit olmadan, ümit de korku olmadan varolamaz.", context: "Duyguların Doğası" },
    { quote: "Barış savaşın yokluğu demek değildir; o bir erdem, ruhun bir halidir.", context: "Siyaset ve Etik" }
  ],
  schopenhauer: [
    { quote: "İnsan istediğini yapabilir ancak istediğini isteyemez.", context: "İradenin Zorunluluğu" },
    { quote: "Dünya benim tasarımımdır.", context: "İrade ve Tasarım Olarak Dünya" }
  ]
};

export default function ChatPage() {
  const [activePersona, setActivePersona] = useState('spinoza');
  // 'chat' | 'database' | 'instructions' | 'aphorisms' | 'thoughts'
  const [currentView, setCurrentView] = useState('chat'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdvancedMenuOpen, setIsAdvancedMenuOpen] = useState(false);
  const [myInput, setMyInput] = useState('');
  
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>(DEFAULT_PROMPTS);
  const [randomAphorism, setRandomAphorism] = useState<any>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (currentView === 'chat') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentView, isThinking]);

  useEffect(() => {
    // Pick random aphorism when switching to the aphorisms view or changing persona in that view
    const list = APHORISMS[activePersona];
    if (list) {
      setRandomAphorism(list[Math.floor(Math.random() * list.length)]);
    }
  }, [activePersona, currentView]);

  const drawNewAphorism = () => {
    const list = APHORISMS[activePersona];
    if (list) {
      setRandomAphorism(list[Math.floor(Math.random() * list.length)]);
    }
  }

  const append = async (msg: any, options: any) => {
    const userMsg = { ...msg, id: Date.now().toString() + 'user' };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);
    setIsThinking(true);

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
          newMsgList[newMsgList.length - 1] = { ...newMsgList[newMsgList.length - 1], content: '⚠️ Groq Sunucusundan yanıt alınamadı. Limit aşımı yaşandı.' };
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
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0d0d0d] border-r border-[#222] transition-transform duration-300 md:relative md:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-[10px_0_40px_rgba(0,0,0,0.5)] md:shadow-none`}>
        <div className="p-5 h-full flex flex-col relative z-50 overflow-y-auto scrollbar-hide">
          
          {/* Logo */}
          <div className="flex items-center gap-3 text-amber-500/90 mb-8 px-2 mt-2">
            <BookOpen size={22} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]"/>
            <h1 className="text-xl font-serif text-zinc-100 font-bold tracking-[0.15em] uppercase">Agora</h1>
          </div>
          
          {/* Persona Dropdown */}
          <div className="mb-8">
            <label className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase mb-3 block px-2">Zihin Seçimi</label>
            <div className="px-2">
              <div className="relative group">
                <select 
                  value={activePersona}
                  onChange={(e) => setActivePersona(e.target.value)}
                  className="w-full appearance-none bg-[#141414] border border-[#333] hover:border-amber-500/30 text-zinc-100 py-3 pl-12 pr-10 rounded-lg focus:outline-none focus:border-amber-500/80 transition-all cursor-pointer font-serif text-sm tracking-wide shadow-inner"
                >
                  {PERSONAS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                
                {/* Avatar Thumbnail in Dropdown */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full overflow-hidden border border-[#333] pointer-events-none">
                   <img src={`/personas/${activePersona}.jpg`} alt="" className="w-full h-full object-cover grayscale opacity-70" onError={(e) => { e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23222' viewBox='0 0 24 24'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"; }} />
                </div>

                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-500 group-hover:text-amber-500/70 transition-colors">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <div className="flex flex-col gap-1 mb-8">
            <div className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase mb-3 px-2 mt-2">Düşünce Sahası</div>
            
            <button 
              onClick={() => { setCurrentView('chat'); setIsSidebarOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${currentView === 'chat' ? 'bg-[#1a1a1a] text-amber-500 shadow-[inset_2px_0_0_rgba(245,158,11,1)]' : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1a1a]'}`}
            >
              <MessageSquare size={16} /> 
              <span className="font-medium text-[13px] tracking-wide">Diyalektik</span>
            </button>

            <button 
              onClick={() => { setCurrentView('aphorisms'); setIsSidebarOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${currentView === 'aphorisms' ? 'bg-[#1a1a1a] text-amber-500 shadow-[inset_2px_0_0_rgba(245,158,11,1)]' : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1a1a]'}`}
            >
              <Quote size={16} /> 
              <span className="font-medium text-[13px] tracking-wide">Zihnin Yankıları</span>
            </button>

            <button 
              onClick={() => { setCurrentView('thought_experiment'); setIsSidebarOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${currentView === 'thought_experiment' ? 'bg-[#1a1a1a] text-amber-500 shadow-[inset_2px_0_0_rgba(245,158,11,1)]' : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1a1a]'}`}
            >
              <Brain size={16} /> 
              <span className="font-medium text-[13px] tracking-wide">Düşünce Deneyleri</span>
            </button>
          </div>

          {/* ADVANCED SETTINGS ACCORDION */}
          <div className="border-t border-[#1a1a1a] pt-4 mt-auto">
             <button 
               onClick={() => setIsAdvancedMenuOpen(!isAdvancedMenuOpen)}
               className="w-full flex items-center justify-between text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-2"
             >
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Sistem Mimari Ayarları</span>
                <ChevronRight size={14} className={`transform transition-transform ${isAdvancedMenuOpen ? 'rotate-90' : ''}`}/>
             </button>
             
             {/* Sub-menu hidden initially */}
             <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isAdvancedMenuOpen ? 'max-h-40 mt-2 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col gap-1 px-1">
                  <button 
                    onClick={() => { setCurrentView('instructions'); setIsSidebarOpen(false); }} 
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-300 ${currentView === 'instructions' ? 'bg-amber-500/10 text-amber-500' : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#111]'}`}
                  >
                    <Settings2 size={13} /> 
                    <span className="font-mono text-[11px] tracking-wide">Talimat Çekirdeği</span>
                  </button>
                  
                  <button 
                    onClick={() => { setCurrentView('database'); setIsSidebarOpen(false); }} 
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-300 ${currentView === 'database' ? 'bg-amber-500/10 text-amber-500' : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#111]'}`}
                  >
                    <Database size={13} /> 
                    <span className="font-mono text-[11px] tracking-wide">Bulut Hafıza (RAG)</span>
                  </button>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full relative z-30">
        
        {/* Header - Transparent and Elegant */}
        <header className="h-20 flex items-center justify-between px-6 shrink-0 sticky top-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a/90] to-transparent z-10 w-full mb-4">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-zinc-400 hover:text-zinc-100 -ml-2 transition-colors">
               <Menu size={20} />
             </button>
             <div className="font-serif text-xl tracking-wider text-zinc-300 opacity-90 flex items-center gap-4">
               {/* Elegant Header Persona Display */}
               {currentView === 'chat' && (
                 <>
                   <div className="w-9 h-9 rounded-full overflow-hidden border border-[#333] shadow-lg relative">
                     <img src={`/personas/${activePersona}.jpg`} alt={currentPersonaData?.name} className="w-full h-full object-cover filter contrast-125 sepia-[0.3]" onError={(e) => e.currentTarget.src = ''} />
                     <div className="absolute inset-0 ring-1 ring-inset ring-black/40 rounded-full"></div>
                   </div>
                   <span>{currentPersonaData?.name}</span>
                 </>
               )}
               {currentView === 'instructions' && <span className="text-amber-500/70">Çekirdek Simülasyon Ayarları</span>}
               {currentView === 'database' && <span className="text-amber-500/70">Vektör Veritabanı (RAG)</span>}
               {currentView === 'aphorisms' && <span className="text-zinc-400">Zihnin Yankıları</span>}
               {currentView === 'thought_experiment' && <span className="text-zinc-400">Düşünce Deneyleri Laboratuvarı</span>}
             </div>
          </div>
        </header>

        {/* --- DYNAMIC VIEWS --- */}

        {/* 1. CHAT VIEW */}
        {currentView === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto px-4 md:px-12 pb-10 space-y-12 scrollbar-hide">
              {(!messages || messages.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 fade-in duration-1000 opacity-70">
                  <div className="w-24 h-24 rounded-full overflow-hidden border border-[#222] shadow-[0_10px_40px_rgba(0,0,0,0.8)] mb-8 opacity-80 backdrop-blur-sm">
                     <img src={`/personas/${activePersona}.jpg`} alt={currentPersonaData?.name} className="w-full h-full object-cover filter contrast-125 saturate-50" />
                  </div>
                  <h2 className="text-3xl md:text-5xl font-serif text-zinc-200 mb-4 tracking-widest drop-shadow-md">{currentPersonaData?.name}</h2>
                  <p className="text-amber-500/80 max-w-sm uppercase text-[11px] tracking-[0.4em] font-bold">{currentPersonaData?.role}</p>
                </div>
              ) : (
                messages.map((m: any) => (
                  <div key={m.id} className={`flex w-full ${m.role === 'user' ? 'justify-end pl-12' : 'justify-start pr-12'}`}>
                    {/* User */}
                    {m.role === 'user' && (
                      <div className="text-[14px] text-zinc-300 font-serif italic text-right leading-relaxed max-w-xl bg-[#141414]/50 border border-[#222] p-5 rounded-2xl rounded-tr-sm shadow-sm backdrop-blur-sm">
                        "{m.content}"
                      </div>
                    )}
                    
                    {/* Bot */}
                    {m.role !== 'user' && (
                      <div className="text-[17px] md:text-[20px] text-zinc-100 font-serif leading-[1.8] max-w-3xl tracking-wide drop-shadow-lg">
                        {(m.content || m.parts?.[0]?.text || '').split('\n').map((line: string, i: number) => (
                          <span key={i}>{line}<br/></span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {/* Artificial Thinking Pacing State */}
              {isThinking && (
                 <div className="flex w-full justify-start fade-in opacity-80 pl-2">
                    <div className="text-[15px] text-zinc-400 font-serif italic flex items-center gap-3">
                       <div className="w-7 h-7 rounded-full overflow-hidden border border-[#333] opacity-60">
                         <img src={`/personas/${activePersona}.jpg`} className="w-full h-full object-cover filter sepia-[0.3]" />
                       </div>
                       Zihin cümleleri toparlıyor...
                    </div>
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
              }} className="relative max-w-4xl mx-auto group">
                <input
                  value={myInput}
                  onChange={(e) => setMyInput(e.target.value)}
                  disabled={isLoading}
                  placeholder="Zihnine bir soru bırak..."
                  className="w-full bg-[#111]/90 backdrop-blur-md border border-[#333] rounded-2xl pl-8 pr-16 py-5 text-zinc-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all placeholder:text-zinc-600 shadow-[0_10px_40px_rgba(0,0,0,0.5)] font-serif text-[16px] tracking-wide"
                />
                <button
                  type="submit"
                  disabled={isLoading || !myInput.trim()}
                  className="absolute right-4 top-4 p-3 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] disabled:opacity-0 disabled:hover:bg-transparent transition-all duration-300"
                >
                  <ArrowUp size={18} />
                </button>
              </form>
            </div>
          </>
        )}

        {/* 2. INSTRUCTIONS VIEW */}
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
                    className="flex-1 w-full bg-black/20 p-6 text-amber-100/70 font-mono text-[13px] leading-[2] focus:outline-none resize-none scrollbar-hide shadow-inner"
                 />
              </div>
              
              <p className="text-red-500/50 text-[11px] mt-4 text-center tracking-wide font-mono uppercase">
                ⚠️ UYARI: BU ALAN SİMÜLASYONUN ÇEKİRDEĞİDİR. DEĞİŞİKLİKLER DİREKT UYGULANIR.
              </p>
            </div>
          </div>
        )}

        {/* 3. DATABASE VIEW */}
        {currentView === 'database' && (
          <div className="flex-1 p-6 md:p-12 fade-in">
             <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-full text-center opacity-70 mt-20">
                <div className="w-20 h-20 rounded-2xl bg-[#111] border border-[#333] flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                  <Database size={32} className="text-amber-500/60" />
                </div>
                <h2 className="text-2xl font-serif text-zinc-200 mb-4 tracking-widest uppercase">Pinecone RAG Bağlantısı Bekleniyor</h2>
                <p className="text-zinc-400 max-w-md font-mono text-[12px] leading-loose text-justify px-4">
                  Sistem, {currentPersonaData?.name}'un binlerce sayfalık orijinal dokümanlarını analiz etmeye hazır. Ancak şu an dış dünyadaki Pinecone vektör veritabanına kapalı devre durumundayız.
                </p>
             </div>
          </div>
        )}

        {/* 4. APHORISMS VIEW (Database-less engaging feature) */}
        {currentView === 'aphorisms' && (
          <div className="flex-1 p-6 md:p-12 fade-in flex items-center justify-center relative">
             <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
                <Quote size={400} />
             </div>
             
             <div className="max-w-3xl mx-auto w-full text-center relative z-10 flex flex-col items-center">
                 {randomAphorism ? (
                   <>
                     <Quote size={48} className="text-amber-500/30 mb-8 mx-auto" />
                     <h2 className="text-3xl md:text-5xl font-serif text-zinc-100 leading-[1.6] mb-12 tracking-wide">
                       "{randomAphorism.quote}"
                     </h2>
                     <div className="flex items-center gap-4 justify-center text-zinc-500">
                       <span className="h-px w-12 bg-zinc-700"></span>
                       <p className="font-mono text-xs uppercase tracking-[0.3em] font-bold text-amber-500/70">{currentPersonaData?.name}</p>
                       <span className="h-px w-12 bg-zinc-700"></span>
                     </div>
                     <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-4">Kavram: {randomAphorism.context}</p>
                   </>
                 ) : (
                   <p className="text-zinc-500 font-serif italic text-xl">"Sessizlik..."</p>
                 )}
                 
                 <button 
                   onClick={drawNewAphorism}
                   className="mt-16 px-8 py-3 rounded-full border border-[#333] hover:border-amber-500/50 hover:bg-amber-500/5 text-zinc-400 hover:text-amber-500 font-serif text-sm transition-all duration-300 shadow-xl backdrop-blur-md"
                 >
                   Başka Bir Yankı Dinle
                 </button>
             </div>
          </div>
        )}

        {/* 5. THOUGHT EXPERIMENTS VIEW (Database-less engaging feature) */}
        {currentView === 'thought_experiment' && (
          <div className="flex-1 p-6 md:p-12 fade-in flex flex-col pt-12">
             <div className="max-w-4xl mx-auto w-full">
               <h2 className="text-3xl font-serif text-zinc-100 mb-4">Paradokslar ve Senaryolar</h2>
               <p className="text-zinc-500 mb-12 font-serif rtl max-w-2xl">Zihni köşeye sıkıştıran klasik felsefi düşünce deneyleri. İlgili deneyi seçerek {currentPersonaData?.name}'un buna nasıl tepki vereceğini doğrudan diyaloğa taşıyabilirsiniz.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[
                   { id: 1, title: 'Tramvay Açmazı', desc: 'Bir düğmeye basarak 5 kişi yerine 1 kişiyi feda eder misin?', prompt: 'Tramvay açmazı (Trolley problem) hakkında ne düşünüyorsun? Mantıksal mı yoksa sezgisel mi hareket etmeliyiz?' },
                   { id: 2, title: 'Deneyim Makinesi (Nozick)', desc: 'Sana saf mutluluk verecek ama sahte olan bir simülasyona bağlanır mıydın?', prompt: 'Robert Nozick\'in deneyim makinesi hakkında düşünceni merak ediyorum. Gerçek ama acı verici bir hayatı mı, yoksa sahte ama kusursuz bir mutluluğu mu seçmeliyim?' },
                   { id: 3, title: 'Panoptikon', desc: 'Görünmez bir otorite tarafından sürekli izlendiği hissine sahip olmak.', prompt: 'Foucault ve Bentham\'ın bahsettiği Panoptikon (gözetim kulesi) hapishanesinin modern toplumdaki yansımaları nelerdir? İrademiz aslında bize mi ait?' },
                   { id: 4, title: 'Tüysüz İki Ayaklı', desc: 'İnsanın tanımı nedir? Badiou veya Platonik bakış...', prompt: 'İnsanı "tüysüz ve iki ayaklı" olarak tanımlayanlara karşı kendi sisteminle nasıl bir insan tanımı yaparsın? İnsanı hayvandan ayıran asıl çizgi nerededir?' }
                 ].map(exp => (
                   <div key={exp.id} className="bg-[#111] border border-[#222] hover:border-amber-500/40 p-6 rounded-2xl cursor-pointer transition-all hover:bg-[#141414] group"
                      onClick={() => {
                        setMyInput(exp.prompt);
                        setCurrentView('chat');
                      }}
                   >
                     <h3 className="text-lg font-serif text-amber-500/90 mb-2 group-hover:text-amber-400">{exp.title}</h3>
                     <p className="text-zinc-400 text-sm leading-relaxed font-serif">{exp.desc}</p>
                     <div className="mt-6 flex items-center justify-end text-[10px] text-zinc-600 uppercase tracking-widest font-bold group-hover:text-amber-500/50 transition-colors">
                       Reaksiyon Al <ArrowUp size={12} className="ml-2" />
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
