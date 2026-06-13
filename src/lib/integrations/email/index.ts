import "server-only";

import { hasEnv } from "@/lib/integrations/env";

/**
 * Email channel abstraction. The inbox and automations send through this
 * interface; the live Gmail adapter activates only when an OAuth access token is
 * available at runtime, otherwise the mock adapter is used.
 */
export interface OutboundEmail {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  threadId?: string | null;
}

export interface EmailSendResult {
  ok: boolean;
  externalId?: string;
  error?: string;
}

export interface EmailAdapter {
  readonly mode: "mock" | "live";
  send(email: OutboundEmail): Promise<EmailSendResult>;
}

function createMockEmailAdapter(): EmailAdapter {
  return {
    mode: "mock",
    async send(email: OutboundEmail): Promise<EmailSendResult> {
      void email;
      return { ok: true, externalId: `mock_email_${Date.now()}` };
    },
  };
}

/** Builds an RFC 5322 message and base64url-encodes it for the Gmail API. */
function encodeMessage(from: string, email: OutboundEmail): string {
  const contentType = email.html ? "text/html" : "text/plain";
  const lines = [
    `From: ${from}`,
    `To: ${email.to}`,
    `Subject: ${email.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: ${contentType}; charset=UTF-8`,
    "",
    email.html ?? email.text ?? "",
  ];
  return Buffer.from(lines.join("\r\n")).toString("base64url");
}

/**
 * Live Gmail adapter. Needs a per-user OAuth access token (GMAIL_ACCESS_TOKEN);
 * the OAuth exchange that mints it is wired when the org connects its account.
 */
function createGmailAdapter(): EmailAdapter {
  return {
    mode: "live",
    async send(email: OutboundEmail): Promise<EmailSendResult> {
      const token = process.env.GMAIL_ACCESS_TOKEN!;
      const from = process.env.EMAIL_FROM ?? "me";
      try {
        const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ raw: encodeMessage(from, email), threadId: email.threadId ?? undefined }),
        });
        if (!res.ok) {
          const detail = await res.text();
          return { ok: false, error: `Gmail API ${res.status}: ${detail.slice(0, 200)}` };
        }
        const data = (await res.json()) as { id?: string };
        return { ok: true, externalId: data.id };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "send failed" };
      }
    },
  };
}

export function getEmailAdapter(): EmailAdapter {
  return hasEnv("GMAIL_ACCESS_TOKEN") ? createGmailAdapter() : createMockEmailAdapter();
}
