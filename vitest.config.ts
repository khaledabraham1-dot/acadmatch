import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Config minimale pour tester le moteur de matching (lib/matching) en
 * isolation, sans dépendre de Next.js ni du DOM (fonctions pures uniquement).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
  },
});
