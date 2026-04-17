import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import fs from 'fs';
import path from 'path';
import { AI_CONFIG } from '@/lib/ai-config';

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

    // Helper function to attempt streaming with a specific model
    const attemptStreaming = async (modelId: string) => {
      return streamText({
        model: openrouter(modelId),
        system: systemPrompt,
        messages,
        temperature: AI_CONFIG.TEMPERATURE,
        maxRetries: 0, // Fallback immediately on first failure
      });
    };

    try {
      // 1. Birincil modeli dene
      console.log(`Attempting primary model: ${AI_CONFIG.PRIMARY_MODEL}`);
      const result = await attemptStreaming(AI_CONFIG.PRIMARY_MODEL);
      return result.toTextStreamResponse();
    } catch (error: any) {
      console.error("Primary Model Error:", error);
      
      // Kota hatası kontrolü (statusCode ve nested error yapılarını kapsar)
      const getStatusCode = (err: any): number | undefined => {
        return err.statusCode || err.status || err.lastError?.statusCode || err.cause?.statusCode;
      };

      const statusCode = getStatusCode(error);
      const errMsg = error.message?.toLowerCase() || "";
      
      const isQuotaError = 
        statusCode === 429 || 
        statusCode === 402 || 
        errMsg.includes("limit") || 
        errMsg.includes("quota") || 
        errMsg.includes("balance") ||
        errMsg.includes("credit") ||
        errMsg.includes("retry") ||
        errMsg.includes("provider returned error");

      if (isQuotaError) {
        console.log("Quota or Rate Limit exceeded. Attempting fallback to:", AI_CONFIG.FALLBACK_MODEL);
        try {
          // 2. Yedek modeli dene
          const fallbackResult = await attemptStreaming(AI_CONFIG.FALLBACK_MODEL);
          return fallbackResult.toTextStreamResponse();
        } catch (fallbackError: any) {
          console.error("Fallback Model Error:", fallbackError);
          const fallbackStatusCode = getStatusCode(fallbackError);
          
          return new Response(
            JSON.stringify({ 
              error: "Zihnimin odalari tozlandi, tum kaynaklar tukendi... (Tum modeller kapasite sinirinda)",
              isQuota: true,
              statusCode: fallbackStatusCode
            }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // Genel hata
      const err = error as any;
      const genericStatusCode = getStatusCode(err) || 500;
      const displayMessage = err.message || "Bilinmeyen bir hata oluÅŸtu.";
      
      return new Response(
        JSON.stringify({ 
          error: `Agora baÄŸlantÄ± kuramÄ±yor: ${displayMessage}`,
          details: `Status: ${genericStatusCode}`
        }), 
        { status: genericStatusCode, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (globalError: any) {
    console.error("Global route error:", globalError);
    return new Response(JSON.stringify({ error: "Kritik bir hata oluştu." }), { status: 500 });
  }
}
