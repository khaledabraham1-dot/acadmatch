import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Client Anthropic — strictement serveur (`import "server-only"` fait
 * échouer le build si jamais importé depuis un composant client). La clé
 * API ne doit jamais atteindre le navigateur, comme la clé secrète Supabase
 * (voir lib/supabase/admin.ts, même principe).
 */
let client: Anthropic | null = null;

export function getAiClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}
