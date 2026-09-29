import { defineConfig, devices } from "@playwright/test";

/**
 * Parcours de bout en bout sur le build de production (`next start`) :
 * lancer `npm run build` avant `npm run test:e2e`. Deux appareils : un
 * ordinateur et un Android d'entrée de gamme, le téléphone type des
 * étudiants visés.
 */
const PORT = 3200;

export default defineConfig({
  testDir: "e2e",
  // Un seul serveur `next start` : au-delà de 2 navigateurs en parallèle, il sature
  // (constaté : délais dépassés à 12 workers, tout passe à 1-2).
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    locale: "fr-FR",
  },
  projects: [
    { name: "ordinateur", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Galaxy S9+"], viewport: { width: 360, height: 740 } } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
