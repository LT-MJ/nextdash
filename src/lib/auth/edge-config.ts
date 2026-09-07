import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe subset of the auth config. This is the ONLY auth config
 * middleware.ts may import — it must never pull in the Credentials
 * provider (which needs bcrypt + Prisma, both Node-only). The full config
 * in config.ts extends this with the real provider for use in the Node.js
 * runtime (API routes, Server Components).
 */
export const edgeAuthConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  trustHost: true,
  providers: [],
};
