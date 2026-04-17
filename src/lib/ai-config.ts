/**
 * Agora AI Configuration
 * Merkezi model ve AI parametreleri yönetimi
 */

export const AI_CONFIG = {
  // Birincil model (Daha yüksek limitli ve çok hızlı Gemini 2.0 Flash Lite)
  PRIMARY_MODEL: 'google/gemini-2.0-flash-lite-preview-02-05:free',
  
  // Yedek model (Eskisi hata veriyordu, Llama 3.3 70B'yi yedeğe çekiyoruz)
  FALLBACK_MODEL: 'meta-llama/llama-3.3-70b-instruct:free',
  
  // Üçüncü yedek (Ekstra güvenlik için)
  SECONDARY_FALLBACK_MODEL: 'deepseek/deepseek-chat:free',
  
  // AI Davranış Ayarları
  TEMPERATURE: 0.85,
  MAX_RETRIES: 2, 
};

export type AIModelId = typeof AI_CONFIG.PRIMARY_MODEL | typeof AI_CONFIG.FALLBACK_MODEL | typeof AI_CONFIG.SECONDARY_FALLBACK_MODEL;
