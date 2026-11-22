import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { buildCapiEvent, capiEventId } from "@/lib/leadops/capi";
import { canSendToContact, highestFact, isServiceWindowOpen, pickAssignee } from "@/lib/leadops/rules";
import { eventKey, parseWhatsAppPayload, verifyMetaSignature } from "@/lib/leadops/whatsapp-webhook";

const SECRET = "app-secret";
const sign = (body: string) => `sha256=${createHmac("sha256", SECRET).update(body).digest("hex")}`;

const ctwaPayload = {
  object: "whatsapp_business_account",
  entry: [{
    id: "WABA",
    changes: [{
      field: "messages",
      value: {
        messaging_product: "whatsapp",
        metadata: { display_phone_number: "526461234567", phone_number_id: "PNID" },
        contacts: [{ profile: { name: "Ana WA" }, wa_id: "5216641112233" }],
        messages: [{
          from: "5216641112233", id: "wamid.1", timestamp: "1763800000", type: "text",
          text: { body: "Hola, quiero info" },
          referral: {
            source_url: "https://fb.me/abc", source_id: "120255091128340616", source_type: "ad",
            headline: "Casas en El Sauzal", body: "Preventa", media_type: "video",
            video_url: "https://v", ctwa_clid: "CLID123",
          },
        }],
      },
    }],
  }],
};

describe("webhook signature", () => {
  const body = JSON.stringify(ctwaPayload);
  it("accepts a valid HMAC-SHA256 signature", () => expect(verifyMetaSignature(body, sign(body), SECRET)).toBe(true));
  it("rejects tampered bodies and missing headers", () => {
    expect(verifyMetaSignature(body + " ", sign(body), SECRET)).toBe(false);
    expect(verifyMetaSignature(body, null, SECRET)).toBe(false);
    expect(verifyMetaSignature(body, "sha256=zz", SECRET)).toBe(false);
  });
});

describe("payload parsing", () => {
  const [event] = parseWhatsAppPayload(ctwaPayload);
  it("extracts the CTWA referral and identities", () => {
    expect(event?.kind).toBe("message");
    if (event?.kind !== "message") return;
    expect(event.waId).toBe("5216641112233");
    expect(event.profileName).toBe("Ana WA");
    expect(event.text).toBe("Hola, quiero info");
    expect(event.referral?.sourceId).toBe("120255091128340616");
    expect(event.referral?.ctwaClid).toBe("CLID123");
    expect(event.referral?.mediaUrl).toBe("https://v");
  });
  it("produces stable idempotency keys", () => {
    expect(eventKey(event!)).toBe("msg:wamid.1");
    const [s] = parseWhatsAppPayload({
      object: "whatsapp_business_account",
      entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: "PNID" },
        statuses: [{ id: "wamid.9", status: "failed", timestamp: "1", errors: [{ code: 131049, title: "Not delivered" }] }] } }] }],
    });
    expect(eventKey(s!)).toBe("status:wamid.9:failed");
    expect(s?.kind === "status" && s.errorCode).toBe("131049");
  });
  it("ignores other objects", () => expect(parseWhatsAppPayload({ object: "page" })).toEqual([]));
});

describe("24h window and send guard", () => {
  const now = new Date("2026-11-22T12:00:00Z");
  it("counts from the customer's last inbound message", () => {
    expect(isServiceWindowOpen(new Date("2026-11-21T12:30:00Z"), now)).toBe(true);
    expect(isServiceWindowOpen(new Date("2026-11-21T11:59:00Z"), now)).toBe(false);
    expect(isServiceWindowOpen(null, now)).toBe(false);
  });
  it("blocks everything for blocked contacts, templates included", () => {
    expect(canSendToContact({ blockedAt: now, lastInboundAt: now, isTemplate: true }, now)).toEqual({ allowed: false, reason: "blocked" });
  });
  it("allows only templates outside the window", () => {
    const old = new Date("2026-11-01T00:00:00Z");
    expect(canSendToContact({ blockedAt: null, lastInboundAt: old, isTemplate: false }, now)).toEqual({ allowed: false, reason: "window_closed" });
    expect(canSendToContact({ blockedAt: null, lastInboundAt: old, isTemplate: true }, now)).toEqual({ allowed: true });
  });
});

describe("assignment", () => {
  it("equitable rotates to whoever waited longest (never assigned first)", () => {
    expect(pickAssignee([
      { membershipId: "b", weight: 0, assignedThisPeriod: 5, lastAssignedAt: new Date(2) },
      { membershipId: "a", weight: 0, assignedThisPeriod: 5, lastAssignedAt: new Date(1) },
      { membershipId: "c", weight: 0, assignedThisPeriod: 0, lastAssignedAt: null },
    ], "equitable")).toBe("c");
  });
  it("weighted fills the largest deficit against target share", () => {
    expect(pickAssignee([
      { membershipId: "a", weight: 70, assignedThisPeriod: 7, lastAssignedAt: null },
      { membershipId: "b", weight: 30, assignedThisPeriod: 2, lastAssignedAt: null },
    ], "weighted")).toBe("b");
  });
  it("returns null without eligible members", () => expect(pickAssignee([], "equitable")).toBeNull());
});

describe("facts and CAPI", () => {
  it("highest milestone counts each lead once", () => expect(highestFact(["name", "budget"])).toBe(4));
  it("builds a business-messaging event with a deterministic id", () => {
    const e = buildCapiEvent({ trigger: "lead_qualified", contactId: "c1", ctwaClid: "CLID", eventTime: new Date(1000) }, "WABA");
    expect(e).toMatchObject({
      event_name: "QualifiedLead", event_id: capiEventId("lead_qualified", "c1"),
      action_source: "business_messaging", messaging_channel: "whatsapp",
      user_data: { whatsapp_business_account_id: "WABA", ctwa_clid: "CLID" },
    });
  });
});
