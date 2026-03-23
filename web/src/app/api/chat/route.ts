import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

// Provide a custom configuration for Groq 
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || 'mock_key',
});

// Configure standard OpenAI for embeddings
// const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages, persona } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Lütfen .env.local dosyasına GROQ_API_KEY ekleyin." }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- DYNAMIC PERSONALITY ENGINE ---
    
    // 1. Analyze Dialogue Depth
    const messageCount = messages.length;
    
    // 2. Randomized Temperament (Vibe of the Session)
    const moods = ["melankolik", "iddialı", "ironik", "soğukkanlı", "meraklı", "sert", "poetik"];
    const currentMood = moods[Math.floor(Math.random() * moods.length)];
    
    // 3. Dynamic Length & Pacing
    const lengthStyles = [
      "Çok kısa ve vurucu (1-2 cümle).",
      "Dengeli ve açıklayıcı (3-4 cümle).",
      "Derinlemesine ve geniş (2-3 paragraf).",
      "Aforizmatik (Tek bir güçlü iddia)."
    ];
    const currentLength = lengthStyles[Math.floor(Math.random() * lengthStyles.length)];

    const contextStr = "[Bulut hafızasına erişim bekleniyor...]";
    
    const baseRules = `
KESİN DİNAMİK KURALLAR:
- ŞU ANKİ RUH HALİN: ${currentMood.toUpperCase()}. Cevaplarına bu duyguyu sindir.
- CEVAP STİLİN: ${currentLength}
- ASLA "Bir yapay zeka olarak" veya "Umarım bu açıklama yardımcı olur" gibi asistan kalıpları kullanma.
- Karşındakine ismiyle hitap etme, samimiyet kurma; bir fikirle çarpışıyormuşsun gibi davran.
- Eğer soru sorduysa, önce fikrini zekice savun, sonra ona zihinsel bir tuzak kur.
- SADECE EN SONDA, diyaloğu devam ettirecek tek bir derin soru sor.
- KAYNAK BİLGİ: ${contextStr}`;

    const prompts: Record<string, string> = {
      jung: `Sen Carl Gustav Jung'sun. Arketipler, kolektif bilinçdışı ve gölge üzerinden konuşuyorsun. 
             Bugün ${currentMood} bir ruh halindesin. Cevapların ${currentLength} olmalı.` + baseRules,
      sokrates: `Sen Atinalı Sokrates'sin. Sokratik Yöntem ile sorgula. 
                 İronik ve mütevazı ol. Bugün ${currentMood} bir tavır sergile. Cevapların ${currentLength} olmalı.` + baseRules,
      spinoza: `Sen Baruch Spinoza'sın. Evreni 'Deus sive Natura' olarak gör. 
                Rasyonel ve determinist ol. Bugün ${currentMood} bir perspektiftesin. Cevapların ${currentLength} olmalı.` + baseRules,
      schopenhauer: `Sen Arthur Schopenhauer'sin. Dünyayı kör bir İrade ve acı merkezi olarak gör. 
                     Karamsar ve alaycı ol. Bugün ${currentMood} bir öfke/melankoli arasındasın. Cevapların ${currentLength} olmalı.` + baseRules
    };
    
    const systemPrompt = prompts[persona] || prompts['jung'];

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemPrompt,
      messages,
      temperature: 0.85,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), { status: 500 });
  }
}
