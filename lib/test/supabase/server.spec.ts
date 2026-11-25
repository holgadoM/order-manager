import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

import { createClient } from "../../supabase/server";

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

describe("createClient de servidor", () => {
  beforeEach(() => {
    delete process.env[URL_KEY];
    delete process.env[PUBLISHABLE_KEY];
  });

  afterEach(() => {
    restoreEnv();
  });

  it("lanza un error claro si falta la URL", async () => {
    process.env[PUBLISHABLE_KEY] = "sb_publishable_test";

    await expect(createClient()).rejects.toThrow(MISSING_ENV);
  });

  it("lanza un error claro si falta la clave publicable", async () => {
    process.env[URL_KEY] = "https://kbanmxsjernnngpfjked.supabase.co";

    await expect(createClient()).rejects.toThrow(MISSING_ENV);
  });

  it("lanza un error claro si ambas variables están vacías", async () => {
    process.env[URL_KEY] = "";
    process.env[PUBLISHABLE_KEY] = "";

    await expect(createClient()).rejects.toThrow(MISSING_ENV);
  });
});
