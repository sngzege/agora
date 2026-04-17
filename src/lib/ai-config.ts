/**
 * Agora AI Configuration
 * Merkezi model ve AI parametreleri yönetimi
 */

export const AI_CONFIG = {
  // Birincil model (Felsefi sohbetler için Llama 3.3)
  PRIMARY_MODEL: 'meta-llama/llama-3.3-70b-instruct:free',
  
  // Yedek model (Yüksek kapasiteli Nvidia Nemotron)
  FALLBACK_MODEL: 'nvidia/nemotron-3-super:free',
  
  // AI Davranış Ayarları
  TEMPERATURE: 0.85,
  MAX_RETRIES: 1, // Quota hatası alındığında sadece 1 kez yedek modele geç
};

export type AIModelId = typeof AI_CONFIG.PRIMARY_MODEL | typeof AI_CONFIG.FALLBACK_MODEL;
