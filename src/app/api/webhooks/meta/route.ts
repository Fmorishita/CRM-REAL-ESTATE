import { NextResponse, type NextRequest } from "next/server";

import { isDemoMode } from "@/lib/db";
import { parseMetaMessagingPayload } from "@/lib/leadops/meta-messaging";
import { verifyMetaSignature } from "@/lib/leadops/whatsapp-webhook";
import { ingestSocialEvent } from "@/modules/leadops/server/social-ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyToken(): string | undefined {
  return process.env.META_WEBHOOK_VERIFY_TOKEN?.trim() || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim();
}

/** Meta subscription handshake (Page and Instagram products). */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const expected = verifyToken();
  if (expected && params.get("hub.mode") === "subscribe" && params.get("hub.verify_token") === expected) {
    return new NextResponse(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

/** Instagram Direct and Facebook Messenger messages. Signature checked on the raw body. */
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
  for (const event of parseMetaMessagingPayload(body)) results.push(await ingestSocialEvent(event));
  const failed = results.includes("failed");
  return NextResponse.json({ ok: !failed, results }, { status: failed ? 500 : 200 });
}
