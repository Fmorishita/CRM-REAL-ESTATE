import { describe, expect, it } from "vitest";

import {
  extractFactsFromText,
  factValueLabel,
  isQualified,
  leadTemperature,
  normalizeFactValue,
} from "@/lib/leadops/qualification";

describe("pre-qualification catalog", () => {
  it("canonicalizes multi-select order and caps purpose at 2", () => {
    expect(normalizeFactValue("purpose", ["investment", "own_use"])).toBe("own_use,investment");
    expect(normalizeFactValue("purpose", ["retirement", "investment", "own_use"])).toBe("own_use,investment");
    expect(normalizeFactValue("bedrooms", ["4"])).toBeNull();
    expect(normalizeFactValue("unknown", ["x"])).toBeNull();
  });

  it("labels stored values", () => {
    expect(factValueLabel("purpose", "own_use,retirement")).toBe("Uso propio, Retiro");
    expect(factValueLabel("timeline", "6m_plus")).toBe("+6 meses");
  });
});

describe("keyword extractor", () => {
  it("reads explicit answers from a WhatsApp message (accents and case ignored)", () => {
    expect(
      extractFactsFromText("Hola! Busco 3 RECÁMARAS para inversión, sería con crédito hipotecario, de inmediato. Prefiero videollamada"),
    ).toEqual({ bedrooms: "3", purpose: "investment", financing: "mortgage", timeline: "immediate", contact_preference: "video_call" });
  });

  it("leaves ambiguous single-choice answers unknown", () => {
    expect(extractFactsFromText("me interesan de 2 o 3 recamaras")).toEqual({});
  });

  it("accepts two purposes", () => {
    expect(extractFactsFromText("es para retiro y para rentarla en airbnb")).toEqual({ purpose: "investment,retirement" });
  });

  it("does not match inside other words", () => {
    expect(extractFactsFromText("ya recibí el mailing")).toEqual({});
  });
});

describe("temperature and qualification", () => {
  it("hot needs a near timeline and a meeting preference", () => {
    expect(leadTemperature({ timeline: "1_3m", contact_preference: "in_person" })).toBe("hot");
    expect(leadTemperature({ timeline: "immediate", contact_preference: "email" })).toBe("warm");
    expect(leadTemperature({ timeline: "6m_plus", contact_preference: "in_person" })).toBe("cold");
    expect(leadTemperature({})).toBe("unknown");
  });
  it("qualified = 4+ answers or 3+ stars", () => {
    expect(isQualified({ answered: 4, stars: null })).toBe(true);
    expect(isQualified({ answered: 2, stars: 3 })).toBe(true);
    expect(isQualified({ answered: 3, stars: 2 })).toBe(false);
  });
});

describe("AI extractor output", () => {
  it("keeps only catalog values and ignores prose and nulls", async () => {
    const { parseAiFacts } = await import("@/lib/leadops/qualification");
    expect(
      parseAiFacts('Claro: {"bedrooms":["3"],"purpose":["investment","yate"],"financing":null,"timeline":"1_3m","hack":["x"]}'),
    ).toEqual({ bedrooms: "3", purpose: "investment", timeline: "1_3m" });
    expect(parseAiFacts("no json")).toEqual({});
  });
});
