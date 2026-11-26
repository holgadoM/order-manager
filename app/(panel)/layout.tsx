import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireSessionUser } from "@/lib/auth";

const sections = [
  { href: "/", label: "Panel" },
  { href: "/products", label: "Productos" },
  { href: "/customers", label: "Clientes" },
  { href: "/orders", label: "Pedidos" },
];

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="px-4 py-6 text-sm text-muted-foreground">Cargando sesión…</p>}>
      <PanelShell>{children}</PanelShell>
    </Suspense>
  );
}

async function PanelShell({ children }: { children: ReactNode }) {
  const user = await requireSessionUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-heading text-base font-semibold">Gestor de pedidos</p>
            <p className="truncate text-sm text-foreground">
              <span className="text-muted-foreground">Sesión: </span>
              <span className="font-medium">{user.email}</span>
            </p>
          </div>
          <SignOutButton />
        </div>
        <nav aria-label="Secciones" className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {section.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8">{children}</div>
    </div>
  );
}
