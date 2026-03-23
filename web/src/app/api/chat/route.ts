import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import fs from 'fs';
import path from 'path';

// Provide a custom configuration for Groq 
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || 'mock_key',
});

export async function POST(req: Request) {
  try {
    const { messages, persona } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Lütfen .env.local dosyasına GROQ_API_KEY ekleyin." }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- DYNAMIC GNOSEOLOGY ENGINE (Markdown-Based) ---
    
    let personaPrompt = "";
    let commonRules = "";
    
    try {
      // Resolve path relative to project root
      const personaPath = path.join(process.cwd(), 'src', 'personas', `${persona}.md`);
      const commonPath = path.join(process.cwd(), 'src', 'personas', 'common.md');
      
      if (fs.existsSync(personaPath)) {
        personaPrompt = fs.readFileSync(personaPath, 'utf8');
      }
      if (fs.existsSync(commonPath)) {
        commonRules = fs.readFileSync(commonPath, 'utf8');
      }
    } catch (e) {
      console.error("Markdown read error:", e);
      // Fallback if fs fails (e.g. edge runtime limitations)
      personaPrompt = `Sen ${persona} karakterisin. Felsefene uygun konuş.`;
    }

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

    // 4. Structural Entropy (Concluding Variance)
    const conclusionStyles = [
        "Cevabını derin ve düşündürücü bir SORU ile bitir.",
        "Cevabını sarsıcı bir tespitle/AFORİZMA ile bitir ve soru sorma.",
        "Cevabını ucu açık, gizemli bir SESSİZLİK davetiyle bitir.",
        "Cevabını doğrudan bir MEYDAN OKUMA ile bitir."
    ];
    const currentConclusion = conclusionStyles[Math.floor(Math.random() * conclusionStyles.length)];

    const systemPrompt = `
${personaPrompt}

${commonRules}

---
KRİTİK TALİMATLAR (ÖNCELİKLİ):
- ASLA LİSTE, MADDELEME VEYA BULLET-POINT KULLANMA. Sadece akışkan paragraflar.
- ASLA "Sessiz kalıyorum" veya "Cevap vermiyorum" gibi bir ifade kullanma. Susaacaksan sadece yazmayı bırak.
- DİL: Kesinlikle ve sadece derinlikli felsefi TÜRKÇE. (İngilizce/Latince sızmasın).
- RUH HALİN: ${currentMood.toUpperCase()}
- CEVAP STİLİN: ${currentLength}
- KAPANIŞ STRATEJİN: ${currentConclusion}
- KAYNAK BİLGİ: [Bulut hafızasına erişim bekleniyor...]
---`;

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
