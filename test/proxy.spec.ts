import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createServerClient, getClaims } = vi.hoisted(() => {
  const getClaims = vi.fn(async () => ({ data: null, error: null }));
  const createServerClient = vi.fn(() => ({
    auth: { getClaims },
  }));

  return { createServerClient, getClaims };
});

vi.mock("@supabase/ssr", () => ({
  createServerClient,
}));

import { config, proxy } from "../proxy";

const URL_KEY = "NEXT_PUBLIC_SUPABASE_URL";
const PUBLISHABLE_KEY = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

const originalUrl = process.env[URL_KEY];
const originalKey = process.env[PUBLISHABLE_KEY];

function restoreEnv(): void {
  if (originalUrl === undefined) {
    delete process.env[URL_KEY];
  } else {
    process.env[URL_KEY] = originalUrl;
  }

  if (originalKey === undefined) {
    delete process.env[PUBLISHABLE_KEY];
  } else {
    process.env[PUBLISHABLE_KEY] = originalKey;
  }
}

function request(): NextRequest {
  return new NextRequest("http://localhost:3000/pedidos");
}

function matcherAccepts(pathname: string): boolean {
  const pattern = config.matcher[0];
  expect(pattern).toBeDefined();
  return new RegExp(`^${pattern}$`).test(pathname);
}

describe("proxy", () => {
  beforeEach(() => {
    createServerClient.mockClear();
    getClaims.mockClear();
    delete process.env[URL_KEY];
    delete process.env[PUBLISHABLE_KEY];
  });

  afterEach(() => {
    restoreEnv();
  });

  it("sigue la petición sin crear el cliente si falta la URL", async () => {
    process.env[PUBLISHABLE_KEY] = "sb_publishable_test";

    const response = await proxy(request());

    expect(response.status).toBe(200);
    expect(createServerClient).not.toHaveBeenCalled();
    expect(getClaims).not.toHaveBeenCalled();
  });

  it("sigue la petición sin crear el cliente si falta la clave publicable", async () => {
    process.env[URL_KEY] = "https://kbanmxsjernnngpfjked.supabase.co";

    const response = await proxy(request());

    expect(response.status).toBe(200);
    expect(createServerClient).not.toHaveBeenCalled();
    expect(getClaims).not.toHaveBeenCalled();
  });

  it("renueva la sesión con getClaims y devuelve la respuesta cuando hay URL y clave", async () => {
    const url = "https://kbanmxsjernnngpfjked.supabase.co";
    const publishableKey = "sb_publishable_test";
    process.env[URL_KEY] = url;
    process.env[PUBLISHABLE_KEY] = publishableKey;

    const response = await proxy(request());

    expect(createServerClient).toHaveBeenCalledTimes(1);
    expect(createServerClient).toHaveBeenCalledWith(
      url,
      publishableKey,
      expect.objectContaining({ cookies: expect.any(Object) }),
    );
    expect(getClaims).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});

describe("matcher del proxy", () => {
  it("excluye estáticos de Next, el favicon y las imágenes", () => {
    expect(matcherAccepts("/pedidos")).toBe(true);
    expect(matcherAccepts("/")).toBe(true);
    expect(matcherAccepts("/_next/static/chunk.js")).toBe(false);
    expect(matcherAccepts("/_next/image")).toBe(false);
    expect(matcherAccepts("/favicon.ico")).toBe(false);
    expect(matcherAccepts("/logo.svg")).toBe(false);
    expect(matcherAccepts("/foto.png")).toBe(false);
    expect(matcherAccepts("/foto.jpg")).toBe(false);
    expect(matcherAccepts("/foto.jpeg")).toBe(false);
    expect(matcherAccepts("/foto.gif")).toBe(false);
    expect(matcherAccepts("/foto.webp")).toBe(false);
  });
});
