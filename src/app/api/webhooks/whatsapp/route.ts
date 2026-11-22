import { NextResponse, type NextRequest } from "next/server";

import { isDemoMode } from "@/lib/db";
import { parseWhatsAppPayload, verifyMetaSignature } from "@/lib/leadops/whatsapp-webhook";
import { ingestWhatsAppEvent } from "@/modules/leadops/server/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Meta webhook verification handshake. */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim();
  if (
    expected &&
    params.get("hub.mode") === "subscribe" &&
    params.get("hub.verify_token") === expected
  ) {
    return new NextResponse(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

/** Inbound messages and delivery statuses. Signature is verified on the raw body. */
export async function POST(request: NextRequest) {
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (!appSecret) return new NextResponse("Not configured", { status: 503 });

  const raw = await request.text();
  if (!verifyMetaSignature(raw, request.headers.get("x-hub-signature-256"), appSecret)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }
  if (isDemoMode()) return NextResponse.json({ ok: true, demo: true });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad JSON", { status: 400 });
  }

  const results = [];
  for (const event of parseWhatsAppPayload(body)) {
    results.push(await ingestWhatsAppEvent(event));
  }
  // 500 only when something failed, so Meta retries; duplicates are no-ops.
  const failed = results.includes("failed");
  return NextResponse.json({ ok: !failed, results }, { status: failed ? 500 : 200 });
}
