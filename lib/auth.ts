import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
};

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // getClaims compara la caducidad del token con la hora actual. connection()
  // deja esa lectura para el momento de la petición, con Cache Components activo.
  await connection();

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub || !claims.email) {
    return null;
  }

  return {
    id: claims.sub,
    email: claims.email,
  };
});

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
