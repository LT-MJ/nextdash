import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roleKey: string;
      roleName: string;
      permissions: string[];
    } & DefaultSession["user"];
  }

  interface User {
    roleKey: string;
    roleName: string;
    permissions: string[];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    roleKey?: string;
    roleName?: string;
    permissions?: string[];
  }
}
