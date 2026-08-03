// Server-only: verifies Firebase ID tokens using Google's public JWKs.
// Works on the edge runtime (WebCrypto), no Node-only admin SDK required.

const JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

type Jwk = JsonWebKey & { kid: string };

let cachedKeys: { keys: Jwk[]; expiresAt: number } | null = null;

async function getKeys(): Promise<Jwk[]> {
  if (cachedKeys && cachedKeys.expiresAt > Date.now()) return cachedKeys.keys;
  const res = await fetch(JWKS_URL);
  if (!res.ok) throw new Error("Could not load Firebase signing keys");
  const body = (await res.json()) as { keys: Jwk[] };
  const cc = res.headers.get("cache-control") ?? "";
  const maxAge = Number(/max-age=(\d+)/.exec(cc)?.[1] ?? 3600);
  cachedKeys = { keys: body.keys, expiresAt: Date.now() + maxAge * 1000 };
  return body.keys;
}

function b64urlToBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export type FirebaseClaims = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  firebase?: { sign_in_provider?: string };
};

export async function verifyFirebaseIdToken(
  idToken: string,
  projectId: string,
): Promise<FirebaseClaims> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Malformed authentication token");
  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];

  const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(headerB64))) as {
    alg: string;
    kid?: string;
  };
  if (header.alg !== "RS256" || !header.kid) throw new Error("Unsupported token signature");

  const jwk = (await getKeys()).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("Unknown token signing key");

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64urlToBytes(signatureB64) as unknown as ArrayBuffer,
    new TextEncoder().encode(`${headerB64}.${payloadB64}`) as unknown as ArrayBuffer,
  );
  if (!valid) throw new Error("Invalid authentication token");

  const claims = JSON.parse(new TextDecoder().decode(b64urlToBytes(payloadB64))) as FirebaseClaims & {
    aud: string;
    iss: string;
    exp: number;
    iat: number;
    auth_time?: number;
  };

  const now = Math.floor(Date.now() / 1000);
  if (claims.aud !== projectId) throw new Error("Token was issued for a different app");
  if (claims.iss !== `https://securetoken.google.com/${projectId}`)
    throw new Error("Token issuer is not trusted");
  if (!claims.sub) throw new Error("Token is missing a user id");
  if (claims.exp <= now) throw new Error("Your session expired, please sign in again");
  if (claims.iat > now + 300) throw new Error("Token timestamp is invalid");

  return claims;
}
