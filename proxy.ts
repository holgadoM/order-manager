import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/products",
  "/customers",
  "/orders",
  "/productos",
  "/clientes",
  "/pedidos",
] as const;

const PATH_ALIASES: Record<string, string> = {
  "/productos": "/products",
  "/clientes": "/customers",
  "/pedidos": "/orders",
};

function isProtectedPath(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }

  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function canonicalPath(pathname: string): string {
  for (const [alias, target] of Object.entries(PATH_ALIASES)) {
    if (pathname === alias || pathname.startsWith(`${alias}/`)) {
      return `${target}${pathname.slice(alias.length)}`;
    }
  }

  return pathname;
}

function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }

  return to;
}

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        for (const [key, value] of Object.entries(headers)) {
          supabaseResponse.headers.set(key, value);
        }
      },
    },
  });

  // Renueva el token antes de que el resto de la petición lea la sesión.
  const { data } = await supabase.auth.getClaims();
  const authenticated = Boolean(data?.claims);
  const pathname = request.nextUrl.pathname;

  if (!authenticated && isProtectedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";

    return copyCookies(supabaseResponse, NextResponse.redirect(redirectUrl));
  }

  const canonical = canonicalPath(pathname);

  if (authenticated && canonical !== pathname) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = canonical;

    return copyCookies(supabaseResponse, NextResponse.rewrite(rewriteUrl));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
