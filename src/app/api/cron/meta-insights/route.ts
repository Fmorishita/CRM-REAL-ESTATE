import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { syncAdInsights } from "@/modules/leadops/server/insights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Daily insights sync. Called by Vercel Cron with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const slug = process.env.LEADOPS_ORGANIZATION_SLUG?.trim();
  const org = slug ? await prisma.organization.findUnique({ where: { slug }, select: { id: true } }) : null;
  if (!org) return NextResponse.json({ ok: false, error: "LEADOPS_ORGANIZATION_SLUG not set or unknown" }, { status: 400 });
  try {
    const result = await syncAdInsights(org.id, 7);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}
