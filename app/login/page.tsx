import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthForms } from "@/components/auth/auth-forms";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Entrar · Gestor de pedidos",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}>
        <LoginGate />
      </Suspense>
    </main>
  );
}

async function LoginGate() {
  const user = await getSessionUser();

  if (user) {
    redirect("/");
  }

  return <AuthForms />;
}
