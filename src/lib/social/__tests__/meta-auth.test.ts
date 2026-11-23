import { beforeEach, describe, expect, it } from "vitest";

import { buildMessageRequest, clearPageTokenCache, resolvePageToken, type FetchLike } from "@/lib/social/meta-auth";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("Meta page-scoped sends", () => {
  beforeEach(() => clearPageTokenCache());

  it("addresses the page explicitly, never /me", () => {
    const req = buildMessageRequest("1408533119003861", "IGSID9", "Hola");
    expect(req.url).toMatch(/\/1408533119003861\/messages$/);
    expect(req.url).not.toContain("/me/");
    expect(req.body).toEqual({ recipient: { id: "IGSID9" }, messaging_type: "RESPONSE", message: { text: "Hola" } });
  });

  it("mints the page token from a system-user token", async () => {
    const calls: string[] = [];
    const f: FetchLike = async (url, init) => {
      calls.push(`${url}|${(init?.headers as Record<string, string>)?.Authorization}`);
      return json({ access_token: "PAGE_TOKEN", id: "1408533119003861" });
    };
    expect(await resolvePageToken("SYSTEM_TOKEN", "1408533119003861", f)).toBe("PAGE_TOKEN");
    expect(calls[0]).toContain("/1408533119003861?fields=access_token|Bearer SYSTEM_TOKEN");
  });

  it("keeps the configured token when it is already a page token (no access_token field)", async () => {
    const f: FetchLike = async () => json({ id: "1408533119003861" });
    expect(await resolvePageToken("ALREADY_PAGE", "1408533119003861", f)).toBe("ALREADY_PAGE");
  });

  it("falls back on API or network errors without throwing", async () => {
    expect(await resolvePageToken("T1", "P", async () => json({ error: { message: "x" } }, 400))).toBe("T1");
    clearPageTokenCache();
    expect(await resolvePageToken("T2", "P", async () => { throw new Error("offline"); })).toBe("T2");
  });

  it("caches the token for 50 minutes", async () => {
    let n = 0;
    const f: FetchLike = async () => (n++, json({ access_token: "PT" }));
    await resolvePageToken("S", "P", f, 1_000);
    await resolvePageToken("S", "P", f, 1_000 + 49 * 60_000);
    expect(n).toBe(1);
    await resolvePageToken("S", "P", f, 1_000 + 51 * 60_000);
    expect(n).toBe(2);
  });
});
