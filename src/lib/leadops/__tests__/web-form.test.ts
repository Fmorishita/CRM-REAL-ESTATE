import { describe, expect, it } from "vitest";

import { mapWebFormLead, phoneVariants, unwrapWebFormBody } from "@/lib/leadops/web-form";

describe("web form mapping", () => {
  it("maps the website's stored codes", () => {
    const lead = mapWebFormLead({
      id: "L1", nombre: "Francisco", telefono: "646 123 4567", interes: "3R", uso: "renta",
      forma_pago: "credito", horizonte_compra: "0-3", modo_visita: "presencial", utm_source: "facebook",
    });
    expect(lead.facts).toEqual({ bedrooms: "3", purpose: "investment", financing: "mortgage", timeline: "1_3m", contact_preference: "in_person" });
    expect(lead.phone).toBe("6461234567");
    expect(lead.utm).toEqual({ utm_source: "facebook" });
  });

  it("maps visible labels and multi-select purpose", () => {
    const lead = mapWebFormLead({
      name: "Ana", phone: "+52 1 646 000 0000", recamaras: "2 recámaras", proposito: ["Uso propio", "Retiro"],
      forma_pago: "Ambos", plazo: "+6 meses", contacto_preferido: "Videollamada",
    });
    expect(lead.facts).toEqual({ bedrooms: "2", purpose: "own_use,retirement", financing: "both", timeline: "6m_plus", contact_preference: "video_call" });
  });

  it("uses interes as purpose when it is not a bedroom code", () => {
    expect(mapWebFormLead({ interes: "segunda_casa" }).facts).toEqual({ purpose: "own_use" });
  });

  it("unwraps Supabase database webhooks and ignores deletes", () => {
    expect(unwrapWebFormBody({ type: "INSERT", table: "leads", record: { nombre: "X" } })).toEqual({ nombre: "X" });
    expect(unwrapWebFormBody({ type: "DELETE", table: "leads", record: { nombre: "X" } })).toBeNull();
  });
});

describe("phone variants", () => {
  it("matches Mexican numbers across form and WhatsApp spellings", () => {
    expect(phoneVariants("6461234567")).toEqual(["526461234567", "5216461234567", "6461234567"]);
    expect(phoneVariants("5216461234567")).toContain("526461234567");
    expect(phoneVariants("14155550000")).toEqual(["14155550000"]);
  });
});
