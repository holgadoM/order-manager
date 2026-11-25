import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClient } = vi.hoisted(() => ({
  createBrowserClient: vi.fn(() => ({ auth: {} })),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient,
}));

import { createClient } from "../../supabase/client";

const URL_KEY = "NEXT_PUBLIC_SUPABASE_URL";
const PUBLISHABLE_KEY = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
const MISSING_ENV =
  "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.";

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

describe("createClient de navegador", () => {
  beforeEach(() => {
    createBrowserClient.mockClear();
    delete process.env[URL_KEY];
    delete process.env[PUBLISHABLE_KEY];
  });

  afterEach(() => {
    restoreEnv();
  });

  it("lanza un error claro si falta la URL", () => {
    process.env[PUBLISHABLE_KEY] = "sb_publishable_test";

    expect(() => createClient()).toThrow(MISSING_ENV);
    expect(createBrowserClient).not.toHaveBeenCalled();
  });

  it("lanza un error claro si falta la clave publicable", () => {
    process.env[URL_KEY] = "https://kbanmxsjernnngpfjked.supabase.co";

    expect(() => createClient()).toThrow(MISSING_ENV);
    expect(createBrowserClient).not.toHaveBeenCalled();
  });

  it("lanza un error claro si ambas variables están vacías", () => {
    process.env[URL_KEY] = "";
    process.env[PUBLISHABLE_KEY] = "";

    expect(() => createClient()).toThrow(MISSING_ENV);
    expect(createBrowserClient).not.toHaveBeenCalled();
  });

  it("crea el cliente con la URL y la clave publicable, sin service_role", () => {
    const url = "https://kbanmxsjernnngpfjked.supabase.co";
    const publishableKey = "sb_publishable_test";
    process.env[URL_KEY] = url;
    process.env[PUBLISHABLE_KEY] = publishableKey;

    createClient();

    expect(createBrowserClient).toHaveBeenCalledTimes(1);
    expect(createBrowserClient).toHaveBeenCalledWith(url, publishableKey);

    const source = readFileSync(
      new URL("../../supabase/client.ts", import.meta.url),
      "utf8",
    );
    expect(source).not.toMatch(/service_role/i);
    expect(JSON.stringify(createBrowserClient.mock.calls)).not.toMatch(
      /service_role/i,
    );
  });
});
