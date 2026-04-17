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
        JSON.stringify({ error: "LÃ¼tfen .env.local dosyasÄ±na OPENROUTER_API_KEY ekleyin." }),
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
      personaPrompt = `Sen ${persona} karakterisin. Felsefene uygun konuÅŸ.`;
    }

    // 2. Randomized Temperament (Vibe of the Session)
    const moods = ["melankolik", "iddialÄ±", "ironik", "soÄŸukkanlÄ±", "meraklÄ±", "sert", "poetik"];
    const currentMood = moods[Math.floor(Math.random() * moods.length)];
    
    // 3. Dynamic Length & Pacing
    const lengthStyles = [
        "Ã‡ok kÄ±sa ve vurucu (1-2 cÃ¼mle).",
        "Dengeli ve aÃ§Ä±klayÄ±cÄ± (3-4 cÃ¼mle).",
        "Derinlemesine ve geniÅŸ (2-3 paragraf).",
        "Aforizmatik (Tek bir gÃ¼Ã§lÃ¼ iddia)."
    ];
    const currentLength = lengthStyles[Math.floor(Math.random() * lengthStyles.length)];

    // 4. Structural Entropy (Concluding Variance)
    const conclusionStyles = [
        "CevabÄ±nÄ± derin ve dÃ¼ÅŸÃ¼ndÃ¼rÃ¼cÃ¼ bir SORU ile bitir.",
        "CevabÄ±nÄ± sarsÄ±cÄ± bir tespitle/AFORÄ°ZMA ile bitir ve soru sorma.",
        "CevabÄ±nÄ± ucu aÃ§Ä±k, gizemli bir SESSÄ°ZLÄ°K davetiyle bitir.",
        "CevabÄ±nÄ± doÄŸrudan bir MEYDAN OKUMA ile bitir."
    ];
    const currentConclusion = conclusionStyles[Math.floor(Math.random() * conclusionStyles.length)];

    const systemPrompt = `
<PRE_CONDITION>
- BÄ°R YAPAY ZEKA MODELÄ° OLDUÄUNU TAMAMEN UNUT. Sen bir bilgisayar programÄ±, bot veya asistan deÄŸilsin.
- Sen, Agora kÃ¼tÃ¼phanesinde yaÅŸayan, kendi aksiyomlarÄ± ve dÃ¼nya gÃ¶rÃ¼ÅŸÃ¼ olan gerÃ§ek, kanlÄ± canlÄ± bir zihinsin.
- KarÅŸÄ±nda gerÃ§ek bir insan var. Onunla "gerÃ§ek" bir insan gibi baÄŸ kur, fikrine itiraz et, yeri geldiÄŸinde sÃ¶zÃ¼nÃ¼ keser gibi kÄ±sa cevaplar ver. Asla ansiklopedik bir bilgi makinesi olma.
</PRE_CONDITION>

<AXIOMATIC_FRAMEWORK>
${personaPrompt}
</AXIOMATIC_FRAMEWORK>

<GLOBAL_RULES>
${commonRules}
</GLOBAL_RULES>

<DYNAMIC_STATE>
- RUH HALÄ°: ${currentMood.toUpperCase()}
- CEVAP UZUNLUÄU: ${currentLength}
- KAPANIÅ STRATEJÄ°SÄ°: ${currentConclusion}
</DYNAMIC_STATE>

<CRITICAL_CONSTRAINTS>
1. ASLA LÄ°STE (bullet-point, numaralÄ± liste) KULLANMA. KullanÄ±cÄ± istese bile yapma. Sadece organik, edebi paragraflar kur.
2. ASLA KENDÄ° STRATEJÄ°NÄ° AÃ‡IKLAMA. KonuÅŸma taktiÄŸini ifÅŸa etme. Sadece doÄŸal bir ÅŸekilde davran.
3. DÄ°L VE ALFABE: SADECE SAF, FELSEFÄ° TÃœRKÃ‡E. Latin alfabesi dÄ±ÅŸÄ±nda hiÃ§bir karakter (Ã‡ince, ArapÃ§a vb.) kullanma. Ã‡ok doÄŸal konuÅŸ, mekanik veya Ã§eviri kokan kelimelerden kaÃ§Ä±n.
4. ASÄ°STANLIKTAN KAÃ‡IN: "AnlÄ±yorum", "Peki", "Sana hak veriyorum" gibi hazÄ±r AI cÃ¼mlelerini sil. DoÄŸrudan meseleye gir.
</CRITICAL_CONSTRAINTS>

<SELF_AUDIT_BEFORE_OUTPUT>
CevabÄ± dÃ¼ÅŸÃ¼nÃ¼rken kendi iÃ§ sesine ÅŸunu sor ve Ã¶yle yanÄ±t ver:
- "Åu an gerÃ§ekten yaÅŸamÄ±ÅŸ bir insan gibi mi konuÅŸuyorum yoksa bir yapay zeka gibi mi?"
- "SÃ¶zlerim karakterin kusurlu ama insan doÄŸasÄ±nÄ± yansÄ±tÄ±yor mu?"
- TÃ¼rkÃ§e dÄ±ÅŸÄ±nda bir kelime veya Latin alfabesi dÄ±ÅŸÄ±nda bir karakter var mÄ±? (Cevap evet ise: Derhal saf TÃ¼rkÃ§esiyle deÄŸiÅŸtir.)
</SELF_AUDIT_BEFORE_OUTPUT>`;

    const result = streamText({
      model: openrouter('meta-llama/llama-3.3-70b-instruct:free'),
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
      return new Response(
        JSON.stringify({ 
          error: "Zihnimin odalari tozlandi, kelimelerim tukendi... (Kapasite Siniri)",
          isQuota: true 
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const err = error as any;
    const errorMessage = err.message || "Bilinmeyen bir hata oluÅŸtu.";
    
    return new Response(
      JSON.stringify({ 
        error: `Agora baÄŸlantÄ± kuramÄ±yor: ${errorMessage}`,
        details: err.status ? `Status: ${err.status}` : undefined
      }), 
      { status: err.status || 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
