/**
 * Envoi anonyme d'une ligne vers une table Supabase ouverte en écriture seule
 * (avis, demandes de formation…), par un simple appel HTTP — sans charger la
 * librairie Supabase, pour rester léger sur mobile.
 *
 * Si l'envoi échoue (réseau coupé, base indisponible, table pas encore
 * créée), la ligne est gardée sur l'appareil et renvoyée plus tard par
 * `flush()`. Aucun identifiant (compte, e-mail) n'est jamais ajouté ici.
 */

const MAX_PENDING = 20;

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Un seul essai d'envoi, sans file d'attente. `keepalive` laisse partir la
 * requête même si l'étudiant quitte la page juste après.
 */
export async function postAnonymousRow(table: string, row: object): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return false;
  try {
    const response = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row),
      keepalive: true,
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function createAnonymousQueue<Row extends object>(table: string, pendingKey: string) {
  function readPending(): Row[] {
    try {
      const parsed = JSON.parse(storage()?.getItem(pendingKey) ?? "[]") as unknown;
      return Array.isArray(parsed) ? (parsed as Row[]) : [];
    } catch {
      return [];
    }
  }

  function writePending(rows: Row[]) {
    try {
      if (rows.length === 0) storage()?.removeItem(pendingKey);
      else storage()?.setItem(pendingKey, JSON.stringify(rows.slice(-MAX_PENDING)));
    } catch {
      // Stockage bloqué : la ligne est perdue, sans gêner l'étudiant.
    }
  }

  return {
    /** Envoie la ligne ; en cas d'échec, la garde pour un nouvel essai. */
    async send(row: Row): Promise<"sent" | "queued"> {
      if (await postAnonymousRow(table, row)) return "sent";
      writePending([...readPending(), row]);
      return "queued";
    },
    /** Renvoie les lignes restées en attente. */
    async flush(): Promise<void> {
      const pending = readPending();
      if (pending.length === 0) return;
      const failed: Row[] = [];
      for (const row of pending) {
        if (!(await postAnonymousRow(table, row))) failed.push(row);
      }
      writePending(failed);
    },
  };
}
