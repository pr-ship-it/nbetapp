import { Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    userId?: string; // userId que ya añadimos antes
    accessToken?: string; // Añadimos accessToken como string (el JWT)
  }
}