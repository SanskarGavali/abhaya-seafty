// Server-only bridge: Firebase is the credential authority, Supabase remains the
// database/storage/session layer so every existing RLS policy keeps working.
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { verifyFirebaseIdToken } from "./firebase-verify.server";

export type BridgeSession = {
  access_token: string;
  refresh_token: string;
  user_id: string;
};

function publishableClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  // listUsers is paginated; the filter keeps it to a single page in practice.
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  const match = data.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
  return match?.id ?? null;
}

/** Verifies a Firebase ID token and returns a real Supabase session for the mapped user. */
export async function exchangeFirebaseToken(idToken: string): Promise<BridgeSession> {
  const projectId = process.env["FIREBASE_PROJECT_ID"];
  if (!projectId) throw new Error("Sign-in is not configured yet. Please try again later.");

  const claims = await verifyFirebaseIdToken(idToken, projectId);
  const email = claims.email?.trim().toLowerCase();
  if (!email) throw new Error("Your account has no email address attached.");

  const fullName = claims.name?.trim() || email;

  // 1. Already mapped?
  const { data: mapped } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("firebase_uid", claims.sub)
    .maybeSingle();

  let userId = mapped?.id ?? null;

  // 2. Existing Supabase user with the same email (migrated account)?
  if (!userId) userId = await findUserIdByEmail(email);

  // 3. Brand new user -> mirror into Supabase auth so all FKs/RLS keep working.
  if (!userId) {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName, firebase_uid: claims.sub },
    });
    if (createErr || !created.user) throw createErr ?? new Error("Could not create your account");
    userId = created.user.id;
  }

  // Keep the identity mapping current (also backfills migrated accounts).
  await supabaseAdmin
    .from("profiles")
    .update({ firebase_uid: claims.sub })
    .eq("id", userId)
    .is("firebase_uid", null);

  // Mint a Supabase session without a password.
  const { data: link, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkErr || !link.properties?.hashed_token)
    throw linkErr ?? new Error("Could not start your session");

  const { data: verified, error: verifyErr } = await publishableClient().auth.verifyOtp({
    type: "email",
    token_hash: link.properties.hashed_token,
  });
  if (verifyErr || !verified.session) throw verifyErr ?? new Error("Could not start your session");

  return {
    access_token: verified.session.access_token,
    refresh_token: verified.session.refresh_token,
    user_id: userId,
  };
}
