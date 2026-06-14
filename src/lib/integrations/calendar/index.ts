import "server-only";

import { hasEnv } from "@/lib/integrations/env";

/**
 * Calendar abstraction used by the Visit Planner to mirror visits as events. The
 * live Google Calendar adapter activates when an OAuth access token is present;
 * otherwise the mock adapter returns a synthetic event id so the flow works in
 * demo mode.
 */
export interface CalendarEventInput {
  title: string;
  description?: string;
  location?: string;
  /** ISO 8601 start/end. */
  startIso: string;
  endIso: string;
  /** IANA timezone, taken from the organization settings. */
  timezone: string;
  attendees?: string[];
}

export interface CalendarEventResult {
  ok: boolean;
  externalId?: string;
  htmlLink?: string;
  error?: string;
}

export interface CalendarAdapter {
  readonly mode: "mock" | "live";
  createEvent(input: CalendarEventInput): Promise<CalendarEventResult>;
}

function createMockCalendarAdapter(): CalendarAdapter {
  return {
    mode: "mock",
    async createEvent(input: CalendarEventInput): Promise<CalendarEventResult> {
      void input;
      return { ok: true, externalId: `mock_event_${Date.now()}` };
    },
  };
}

function createGoogleCalendarAdapter(): CalendarAdapter {
  return {
    mode: "live",
    async createEvent(input: CalendarEventInput): Promise<CalendarEventResult> {
      const token = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN!;
      try {
        const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: input.title,
            description: input.description,
            location: input.location,
            start: { dateTime: input.startIso, timeZone: input.timezone },
            end: { dateTime: input.endIso, timeZone: input.timezone },
            attendees: input.attendees?.map((email) => ({ email })),
          }),
        });
        if (!res.ok) {
          const detail = await res.text();
          return { ok: false, error: `Calendar API ${res.status}: ${detail.slice(0, 200)}` };
        }
        const data = (await res.json()) as { id?: string; htmlLink?: string };
        return { ok: true, externalId: data.id, htmlLink: data.htmlLink };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "create failed" };
      }
    },
  };
}

export function getCalendarAdapter(): CalendarAdapter {
  return hasEnv("GOOGLE_CALENDAR_ACCESS_TOKEN") ? createGoogleCalendarAdapter() : createMockCalendarAdapter();
}
