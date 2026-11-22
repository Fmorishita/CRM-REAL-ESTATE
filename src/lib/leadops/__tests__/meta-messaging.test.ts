import { describe, expect, it } from "vitest";

import { parseMetaMessagingPayload, socialEventKey } from "@/lib/leadops/meta-messaging";

describe("Messenger / Instagram webhook parsing", () => {
  it("reads an Instagram DM with an ad referral", () => {
    const [e] = parseMetaMessagingPayload({
      object: "instagram",
      entry: [{
        id: "IG1", time: 1700000000000,
        messaging: [{
          sender: { id: "IGSID9" }, recipient: { id: "IG1" }, timestamp: 1700000000000,
          message: { mid: "m_1", text: "Hola, ¿precio de la casa?", referral: { ad_id: "AD7", source: "ADS", ads_context_data: { ad_title: "California" } } },
        }],
      }],
    });
    expect(e).toMatchObject({ network: "instagram", accountId: "IG1", userId: "IGSID9", text: "Hola, ¿precio de la casa?", isEcho: false });
    expect(e!.referral).toMatchObject({ adId: "AD7", headline: "California" });
    expect(socialEventKey(e!)).toBe("instagram:m_1");
  });

  it("treats echoes as business messages to the recipient", () => {
    const [e] = parseMetaMessagingPayload({
      object: "page",
      entry: [{ id: "PAGE1", messaging: [{ sender: { id: "PAGE1" }, recipient: { id: "PSID5" }, timestamp: 1, message: { mid: "m_2", text: "Te marco", is_echo: true, app_id: 263902037430900 } }] }],
    });
    expect(e).toMatchObject({ network: "facebook", userId: "PSID5", isEcho: true, appId: "263902037430900" });
  });

  it("labels attachments and skips reads/deliveries", () => {
    const events = parseMetaMessagingPayload({
      object: "page",
      entry: [{ id: "PAGE1", messaging: [
        { sender: { id: "PSID5" }, recipient: { id: "PAGE1" }, timestamp: 2, message: { mid: "m_3", attachments: [{ type: "image", payload: { url: "https://x/y.jpg" } }] } },
        { sender: { id: "PSID5" }, recipient: { id: "PAGE1" }, timestamp: 3, read: { watermark: 3 } },
      ] }],
    });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ text: "[imagen]", media: [{ type: "image", url: "https://x/y.jpg" }] });
  });

  it("ignores other webhook objects", () => {
    expect(parseMetaMessagingPayload({ object: "whatsapp_business_account", entry: [] })).toEqual([]);
  });
});
