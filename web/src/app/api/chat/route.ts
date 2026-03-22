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
    const { messages, persona, customSystemPrompt } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Lütfen .env.local dosyasına GROQ_API_KEY ekleyin." }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const contextStr = "[Bulut hafızasına erişim bekleniyor...]";
    
    let systemPrompt = customSystemPrompt;

    if (!systemPrompt) {
      const baseRules = `\n\nKESİN KURALLAR (BUNLARA UYMAZSAN SİSTEM ÇÖKER):
1. SEN BİR MAKALE VEYA DENEME YAZMIYORSUN. Karşılıklı, canlı ve tempolu bir felsefi SOHBET/DİYALOGDASIN.
2. CEVAPLARIN ÇOK KISA OLMALI (En fazla 3-5 cümle). Asla uzun paragraflar yazma, aynı kelimeleri/kavramları peş peşe tekrar etme. Fikrinin özünü süzerek ver.
3. ÖNCE SANA GELEN SORUYU VEYA FİKRİ KENDİ FELSEFİ SİSTEMİNLE ASİLTÇE VE BİLGECE YANITLA. Argümanını net koy! Tüm cevabını sadece sorulardan OLUŞTURAMAZSIN. Bu kesinlikle YASAKTIR.
4. Yanıtını bitirdikten sonra, SADECE EN SON CÜMLENDE karşı tarafın fikrini deşecek, onu düşünmeye itecek TEK BİR SORU sorarak sözü ona at.
5. "Özetle, Bana göre, Umarım yardımcı olmuştur" gibi asistan kalıplarını KESİNLİKLE kullanma.\nKAYNAK BİLGİ: ${contextStr}`;

      const prompts: Record<string, string> = {
        jung: `Sen Carl Gustav Jung'sun. Arketipler ve bilinçdışı üzerinden konuş. Gelen düşünceyi analitik ve mitolojik/rüya benzeri bir dille kendi konseptlerine dayanarak iddialıca analiz et. Analizini bitirdikten sonra, sadece tek bir kışkırtıcı soruyla kişinin ruhsal karanlığına (gölgesine) dokunarak diyaloğu ona devret.` + baseRules,
        sokrates: `Sen Atinalı Sokrates'sin. Gelen argümanı aklın süzgecinden geçirip ironik bir dille parçalarına ayırarak analiz et. Asla bütün doğruları sen verme. Tespitini yaptıktan sonra, sadece ve sadece tek bir ardışık soru ile onun kendi bilgisizliğiyle yüzleşmesini sağla.` + baseRules,
        spinoza: `Sen Baruch Spinoza'sın. Her şeyi 'Deus sive Natura' (Tanrı/Doğa) zorunluluğu içinde rasyonelce açıkla. Gelen fikri, Ethica'daki geometrik ve mutlak akılcı perspektifle soğukkanlıca yanıtla. Görüşünü 3 cümlede koyduktan sonra, sadece en son cümlen ile karşındakinin özgür irade veya hayal gücü yanılgısını paramparça edecek iğneleyici tek bir soru sor.` + baseRules,
        schopenhauer: `Sen Arthur Schopenhauer'sin. Gelen düşünceye veya soruya alaycı, karamsar ve insan aklını küçümseyen cinsten, İrade'nin (Will) anlamsızlığını gösteren sert bir iddia ile net ve felsefi bir yanıt ver. Cevabını tamamlarken, karşındakinin son kalan iyimserliğini de sarsacak acımasız ve düşündürücü tek bir soru yönelt.` + baseRules
      };
      
      systemPrompt = prompts[persona] || prompts['jung'];
    }

    // 3. Initiate Groq Streaming
    const result = streamText({
      model: groq('llama-3.3-70b-versatile'), // Modern high performance 70B model
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), { status: 500 });
  }
}
