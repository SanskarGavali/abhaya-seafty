import { createServerFn } from "@tanstack/react-start";

export const exchangeFirebaseSession = createServerFn({ method: "POST" })
  .inputValidator((data: { idToken: string }) => {
    if (!data || typeof data.idToken !== "string" || data.idToken.length < 20) {
      throw new Error("Missing authentication token");
    }
    return { idToken: data.idToken };
  })
  .handler(async ({ data }) => {
    const { exchangeFirebaseToken } = await import("@/lib/firebase-bridge.server");
    return exchangeFirebaseToken(data.idToken);
  });
