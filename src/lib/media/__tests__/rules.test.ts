import { describe, expect, it } from "vitest";

import { belongsToOrganization, checkOutgoingMedia, extensionFor, isPlaceholderBody, parseMedia } from "@/lib/media/rules";

describe("outgoing media rules", () => {
  it("accepts a JPEG photo on every channel", () => {
    for (const ch of ["whatsapp", "instagram", "facebook"] as const) {
      expect(checkOutgoingMedia(ch, "image/jpeg", 2_000_000)).toEqual({ ok: true, kind: "image" });
    }
  });

  it("explains that Instagram does not take documents", () => {
    const r = checkOutgoingMedia("instagram", "application/pdf", 100_000);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toContain("Instagram no admite documentos");
  });

  it("allows a PDF on WhatsApp and Messenger", () => {
    expect(checkOutgoingMedia("whatsapp", "application/pdf", 5_000_000)).toEqual({ ok: true, kind: "document" });
    expect(checkOutgoingMedia("facebook", "application/pdf", 5_000_000)).toEqual({ ok: true, kind: "document" });
  });

  it("rejects oversized and empty files with the limit in the message", () => {
    const big = checkOutgoingMedia("whatsapp", "image/jpeg", 6 * 1024 * 1024);
    expect(!big.ok && big.error).toContain("hasta 5 MB");
    expect(checkOutgoingMedia("whatsapp", "image/jpeg", 0).ok).toBe(false);
  });

  it("rejects a format the channel cannot send", () => {
    expect(checkOutgoingMedia("instagram", "image/webp", 1000).ok).toBe(false);
  });
});

describe("stored media", () => {
  it("normalizes arrays, legacy objects without url and unknown types", () => {
    expect(parseMedia([{ type: "audio", url: "https://x/a.mp4" }, { type: "image", url: "ftp://bad" }])).toEqual([
      { type: "audio", url: "https://x/a.mp4", name: undefined, mime: undefined },
    ]);
    expect(parseMedia({ type: "image" })).toEqual([]);
    expect(parseMedia([{ type: "file", url: "https://x/c.pdf", name: "c.pdf" }])[0]).toMatchObject({ type: "document", name: "c.pdf" });
    expect(parseMedia(null)).toEqual([]);
  });

  it("detects placeholder bodies", () => {
    expect(isPlaceholderBody("[nota de voz]")).toBe(true);
    expect(isPlaceholderBody("Mira esta foto")).toBe(false);
  });

  it("derives extensions", () => {
    expect(extensionFor("image/jpeg")).toBe("jpg");
    expect(extensionFor("application/octet-stream", "Brochure Final.PDF")).toBe("pdf");
  });

  it("keeps storage paths inside the organization", () => {
    expect(belongsToOrganization("org-1/out/a.jpg", "org-1")).toBe(true);
    expect(belongsToOrganization("org-2/out/a.jpg", "org-1")).toBe(false);
    expect(belongsToOrganization("org-1/../org-2/a.jpg", "org-1")).toBe(false);
  });
});

describe("review fixes", () => {
  it("never allows an outgoing file larger than the Storage cap", async () => {
    const { MEDIA_RULES, STORAGE_MAX_BYTES } = await import("@/lib/media/rules");
    for (const rules of Object.values(MEDIA_RULES)) {
      for (const rule of Object.values(rules)) expect(rule!.maxBytes).toBeLessThanOrEqual(STORAGE_MAX_BYTES);
    }
    const r = checkOutgoingMedia("whatsapp", "application/pdf", 60 * 1024 * 1024);
    expect(!r.ok && r.error).toContain("hasta 50 MB");
  });

  it("keeps stickers, reels and story mentions as image/video instead of documents", async () => {
    const { normalizeMediaType } = await import("@/lib/media/rules");
    expect(normalizeMediaType("sticker")).toBe("image");
    expect(normalizeMediaType("ig_reel")).toBe("video");
    expect(normalizeMediaType("story_mention")).toBe("image");
    expect(normalizeMediaType("file")).toBe("document");
    expect(normalizeMediaType(undefined)).toBe("document");
  });
});
