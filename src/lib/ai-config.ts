/**
 * Agora AI Configuration
 * Merkezi model ve AI parametreleri yönetimi
 */

export const AI_CONFIG = {
  PRIMARY_MODEL: "google/gemma-4-31b-it:free",
  FALLBACK_MODEL: "meta-llama/llama-3.3-70b-instruct:free", 

  TEMPERATURE: 0.85,
  MAX_RETRIES: 3, 
};

export type AIModelId = typeof AI_CONFIG.PRIMARY_MODEL | typeof AI_CONFIG.FALLBACK_MODEL
