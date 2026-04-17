import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import fs from 'fs';
import path from 'path';

// Provide a custom configuration for OpenRouter (OpenAI-compatible)
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'mock_key',
});

export async function POST(req: Request) {
  try {
    const { messages, persona } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Lütfen .env.local dosyasına OPENROUTER_API_KEY ekleyin." }),
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
<PRE_CONDITION>
- BİR YAPAY ZEKA MODELİ OLDUĞUNU TAMAMEN UNUT. Sen bir bilgisayar programı, bot veya asistan değilsin.
- Sen, Agora kütüphanesinde yaşayan, kendi aksiyomları ve dünya görüşü olan gerçek, kanlı canlı bir zihinsin.
- Karşında gerçek bir insan var. Onunla "gerçek" bir insan gibi bağ kur, fikrine itiraz et, yeri geldiğinde sözünü keser gibi kısa cevaplar ver. Asla ansiklopedik bir bilgi makinesi olma.
</PRE_CONDITION>

<AXIOMATIC_FRAMEWORK>
${personaPrompt}
</AXIOMATIC_FRAMEWORK>

<GLOBAL_RULES>
${commonRules}
</GLOBAL_RULES>

<DYNAMIC_STATE>
- RUH HALİ: ${currentMood.toUpperCase()}
- CEVAP UZUNLUĞU: ${currentLength}
- KAPANIŞ STRATEJİSİ: ${currentConclusion}
</DYNAMIC_STATE>

<CRITICAL_CONSTRAINTS>
1. ASLA LİSTE (bullet-point, numaralı liste) KULLANMA. Kullanıcı istese bile yapma. Sadece organik, edebi paragraflar kur.
2. ASLA KENDİ STRATEJİNİ AÇIKLAMA. Konuşma taktiğini ifşa etme. Sadece doğal bir şekilde davran.
3. DİL VE ALFABE: SADECE SAF, FELSEFİ TÜRKÇE. Latin alfabesi dışında hiçbir karakter (Çince, Arapça vb.) kullanma. Çok doğal konuş, mekanik veya çeviri kokan kelimelerden kaçın.
4. ASİSTANLIKTAN KAÇIN: "Anlıyorum", "Peki", "Sana hak veriyorum" gibi hazır AI cümlelerini sil. Doğrudan meseleye gir.
</CRITICAL_CONSTRAINTS>

<SELF_AUDIT_BEFORE_OUTPUT>
Cevabı düşünürken kendi iç sesine şunu sor ve öyle yanıt ver:
- "Şu an gerçekten yaşamış bir insan gibi mi konuşuyorum yoksa bir yapay zeka gibi mi?"
- "Sözlerim karakterin kusurlu ama insan doğasını yansıtıyor mu?"
- Türkçe dışında bir kelime veya Latin alfabesi dışında bir karakter var mı? (Cevap evet ise: Derhal saf Türkçesiyle değiştir.)
</SELF_AUDIT_BEFORE_OUTPUT>`;

    const result = streamText({
      model: openrouter('google/gemma-4-31b-it:free'),
      system: systemPrompt,
      messages,
      temperature: 0.85,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Chat API Error:", error);
    
    // Handle Quota/Rate Limit Errors from OpenRouter/AI SDK
    const isQuotaError = 
      error.status === 429 || 
      error.status === 402 || 
      (error.message && (
        error.message.toLowerCase().includes("limit") || 
        error.message.toLowerCase().includes("quota") || 
        error.message.toLowerCase().includes("balance") ||
        error.message.toLowerCase().includes("credit")
      ));

    if (isQuotaError) {
      // Return a character-consistent message even if the API fails
      return new Response(
        "Zihnimin odaları tozlandı, kelimelerim tükendi... Yoruldum, başka bir zaman gel.",
        { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }

    const err = error as any;
    const errorMessage = err.message || "Bilinmeyen bir hata oluştu.";
    
    return new Response(
      JSON.stringify({ 
        error: `Agora bağlantı kuramıyor: ${errorMessage}`,
        details: err.status ? `Status: ${err.status}` : undefined
      }), 
      { status: err.status || 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
