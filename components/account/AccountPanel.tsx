"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ShieldAlert } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/account/LoginForm";
import { AccountDashboard } from "@/components/account/AccountDashboard";

/**
 * Tant que Khaled n'a pas terminé la configuration Supabase (voir
 * docs/accounts-setup.md), cette page doit rester inoffensive plutôt que de
 * planter — les comptes sont une fonctionnalité additive, jamais un
 * pré-requis pour utiliser AcadMatch.
 */
export function AccountPanel() {
  const [configured] = useState(isSupabaseConfigured());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.subscription.unsubscribe();
  }, [configured]);

  if (!configured) {
    return (
      <Card className="border-amber-100 bg-amber-50/60">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Comptes bientôt disponibles</h2>
            <p className="mt-1 text-sm text-slate-600">
              Cette fonctionnalité est en cours de mise en place. En attendant, votre profil reste
              disponible sur cet appareil (localStorage), sans compte requis.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (loading) return null;

  return user ? <AccountDashboard user={user} /> : <LoginForm />;
}
