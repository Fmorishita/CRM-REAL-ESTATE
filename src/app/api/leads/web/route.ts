import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { isDemoMode } from "@/lib/db";
import { mapWebFormLead, unwrapWebFormBody } from "@/lib/leadops/web-form";
import { ingestWebFormLead } from "@/modules/leadops/server/web-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: NextRequest, secret: string): boolean {
  const header =
    request.headers.get("x-webhook-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  const a = Buffer.from(header);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Website form → CRM. Server-to-server only (Supabase database webhook on the
 * website's `leads` table, or the site's own API route). Protected by
 * WEB_LEADS_SECRET; never called from the browser, so the secret stays private.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.WEB_LEADS_SECRET?.trim();
  if (!secret) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  if (!authorized(request, secret)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const row = unwrapWebFormBody(body);
  if (!row) return NextResponse.json({ ok: true, ignored: "event_type" });
  if (isDemoMode()) return NextResponse.json({ ok: true, demo: true, mapped: mapWebFormLead(row).facts });

  try {
    const result = await ingestWebFormLead(mapWebFormLead(row));
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("web lead intake failed:", error);
    return NextResponse.json({ ok: false, error: "intake_failed" }, { status: 500 });
  }
}
