/**
 * Dashboard greeting system — time, season, and event-aware
 * Localised to Perth, Western Australia (AWST UTC+8)
 *
 * Covers:
 * - Time of day (morning/afternoon/evening/late night)
 * - Season (WA seasons: hot summer, mild winter)
 * - National public holidays (AU)
 * - WA state holidays
 * - Perth local events / cultural moments
 * - Special calendar moments (EOFY, new year, etc.)
 */

import { getPerthHour } from "./perth-time";

interface GreetingContext {
  hour: number;
  month: number;   // 1-12
  day: number;     // 1-31
  weekday: number; // 0=Sun, 1=Mon ... 6=Sat
  name: string;
}

type GreetingEntry = {
  message: string;
  sub?: string;
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Check if today matches a notable event — returns greeting or null */
function getEventGreeting({ month, day, weekday, hour, name }: GreetingContext): GreetingEntry | null {
  const n = name;

  // ── National / WA Public Holidays ──────────────────────────────
  // New Year's Day
  if (month === 1 && day === 1) return pick([
    { message: `Happy New Year, ${n}.`, sub: "A fresh start — let's make it count." },
    { message: `Welcome to the new year, ${n}.`, sub: "New year, same excellent care standards." },
  ]);

  // Australia Day (26 Jan) — inclusive, reflective tone
  if (month === 1 && day === 26) return pick([
    { message: `Australia Day, ${n}.`, sub: "A moment to reflect on community and care." },
    { message: `Good morning, ${n}.`, sub: "Australia Day — take a breath and be present." },
  ]);

  // Easter Friday (approx — Good Friday varies; we catch the general Easter weekend ~Mar-Apr)
  // We'll detect Anzac Day more reliably
  if (month === 4 && day === 25) return pick([
    { message: `Lest we forget, ${n}.`, sub: "ANZAC Day — a day of remembrance." },
    { message: `Good morning, ${n}.`, sub: "ANZAC Day. We honour those who served." },
  ]);

  // WA Day (first Monday of June)
  if (month === 6 && weekday === 1 && day <= 7) return pick([
    { message: `Happy WA Day, ${n}.`, sub: "The State of Excitement — and excellent care." },
    { message: `Morning, ${n}.`, sub: "WA Day — proud to serve this community." },
  ]);

  // EOFY (End of Financial Year — 30 June)
  if (month === 6 && day === 30) return {
    message: `End of financial year, ${n}.`,
    sub: "Last day of the financial year — invoices and reports should be finalised.",
  };

  // New Financial Year
  if (month === 7 && day === 1) return {
    message: `New financial year, ${n}.`,
    sub: "FY25-26 starts today. A clean slate.",
  };

  // Queen's/King's Birthday WA (last Monday of September)
  if (month === 9 && weekday === 1 && day >= 25) return pick([
    { message: `Good morning, ${n}.`, sub: "WA's King's Birthday long weekend — enjoy the break." },
  ]);

  // Christmas Eve
  if (month === 12 && day === 24) return pick([
    { message: `Christmas Eve, ${n}.`, sub: "Almost time to rest. The team has worked hard this year." },
    { message: `Good morning, ${n}.`, sub: "Christmas Eve — the clients appreciate all you do." },
  ]);

  // Christmas Day
  if (month === 12 && day === 25) return pick([
    { message: `Merry Christmas, ${n}.`, sub: "Wishing warmth and rest to you and yours." },
    { message: `Happy Christmas, ${n}.`, sub: "Care work doesn't stop — thank you for showing up." },
  ]);

  // Boxing Day
  if (month === 12 && day === 26) return pick([
    { message: `Good morning, ${n}.`, sub: "Boxing Day — leftover celebrations are still celebrations." },
  ]);

  // New Year's Eve
  if (month === 12 && day === 31) return pick([
    { message: `Last day of the year, ${n}.`, sub: "Finish strong. Tomorrow is a clean slate." },
    { message: `New Year's Eve, ${n}.`, sub: "One more day — you've done well this year." },
  ]);

  // ── Perth / WA Seasonal / Local moments ───────────────────────
  // Perth Royal Show (September, ~last week)
  if (month === 9 && day >= 20 && day <= 30) return pick([
    { message: `Perth Royal Show season, ${n}.`, sub: "The showgrounds are buzzing. Don't forget to eat something on a stick." },
    { message: `Good morning, ${n}.`, sub: "Royal Show time in Perth — keep an eye on client schedules." },
    null, // sometimes just use normal greeting
  ].filter(Boolean) as GreetingEntry[]);

  // Fringe World (Perth) — late Jan to mid Feb
  if ((month === 1 && day >= 20) || (month === 2 && day <= 15)) return pick([
    { message: `Fringe World season, ${n}.`, sub: "Perth is buzzing with street performers this month." },
    null,
  ].filter(Boolean) as GreetingEntry[]);

  // Wildflower season (Aug-Oct) — WA is famous for it
  if (month >= 8 && month <= 10) return pick([
    { message: `Wildflower season, ${n}.`, sub: "WA's wildflowers are out. Even the commute is scenic right now." },
    null,
    null, // weight towards null so not every day is this
  ].filter(Boolean) as GreetingEntry[]);

  // Perth summer (Dec-Feb) — extreme heat warnings
  if (month === 12 || month === 1 || month === 2) return pick([
    { message: `Hot one today, ${n}.`, sub: "Perth summer — make sure clients are hydrated and cool." },
    { message: `Summer in Perth, ${n}.`, sub: "Stay hydrated. Check on clients in the heat." },
    null,
  ].filter(Boolean) as GreetingEntry[]);

  // Perth winter (Jun-Aug) — mild but notable
  if (month >= 6 && month <= 8) return pick([
    { message: `Winter in Perth, ${n}.`, sub: "Cosy weather — the best time of year in the west." },
    null,
    null,
  ].filter(Boolean) as GreetingEntry[]);

  // Monday
  if (weekday === 1) return pick([
    { message: `Monday again, ${n}.`, sub: "The week is fresh. Let's set it up well." },
    { message: `Good morning, ${n}.`, sub: "New week, clean slate." },
    null,
  ].filter(Boolean) as GreetingEntry[]);

  // Friday
  if (weekday === 5) return pick([
    { message: `Friday at last, ${n}.`, sub: "Nearly there — finish the week well." },
    { message: `Good morning, ${n}.`, sub: "Friday. The team is nearly at the finish line." },
    null,
  ].filter(Boolean) as GreetingEntry[]);

  return null;
}

/** Time-of-day phrases — warm, professional, not too chirpy */
function getTimeGreeting(hour: number, name: string): GreetingEntry {
  if (hour >= 5 && hour < 9) return pick([
    { message: `Early start, ${name}.`, sub: "The dedication doesn't go unnoticed." },
    { message: `Good morning, ${name}.`, sub: "You're in early — let's make it count." },
    { message: `Morning, ${name}.`, sub: "Quiet before the day begins." },
  ]);

  if (hour >= 9 && hour < 12) return pick([
    { message: `Good morning, ${name}.`, sub: "Hope the day is off to a smooth start." },
    { message: `Morning, ${name}.`, sub: "Plenty of day ahead — let's get into it." },
    { message: `Good morning, ${name}.`, sub: "The team is already on the move." },
  ]);

  if (hour >= 12 && hour < 14) return pick([
    { message: `Good afternoon, ${name}.`, sub: "Lunch hour — even care managers need to eat." },
    { message: `Afternoon, ${name}.`, sub: "The morning rush is past. Let's see how the day is tracking." },
    { message: `Good afternoon, ${name}.`, sub: "Hope the morning treated you well." },
  ]);

  if (hour >= 14 && hour < 17) return pick([
    { message: `Afternoon, ${name}.`, sub: "Getting through it — the day is more than half done." },
    { message: `Good afternoon, ${name}.`, sub: "Afternoon shift well underway." },
    { message: `Afternoon, ${name}.`, sub: "The second half of the day — keep the momentum." },
  ]);

  if (hour >= 17 && hour < 20) return pick([
    { message: `Good evening, ${name}.`, sub: "Still at it. The dedication shows." },
    { message: `Evening, ${name}.`, sub: "Day shift winding down — evening crew taking over." },
    { message: `Good evening, ${name}.`, sub: "Hope the day was manageable." },
  ]);

  if (hour >= 20 && hour < 23) return pick([
    { message: `Good evening, ${name}.`, sub: "Working late — the clients are fortunate to have you." },
    { message: `Evening, ${name}.`, sub: "Long day. I'll keep things brief." },
  ]);

  // Late night / early hours
  return pick([
    { message: `Late shift, ${name}.`, sub: "Night crew matters just as much. I'm here if needed." },
    { message: `Good evening, ${name}.`, sub: "Burning the midnight oil — I hope it's worthwhile." },
  ]);
}

/**
 * Get the complete dashboard greeting for a user.
 * Returns { message, sub } for rendering.
 */
export function getDashboardGreeting(name: string): { message: string; sub: string } {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Australia/Perth" }));
  const ctx: GreetingContext = {
    hour: now.getHours(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    weekday: now.getDay(),
    name,
  };

  // Try event greeting first (30% chance to skip even if applicable, for variety)
  const eventGreeting = getEventGreeting(ctx);
  if (eventGreeting && Math.random() > 0.3) {
    return {
      message: eventGreeting.message,
      sub: eventGreeting.sub ?? "",
    };
  }

  // Fall back to time-of-day
  const timeGreeting = getTimeGreeting(ctx.hour, name);
  return {
    message: timeGreeting.message,
    sub: timeGreeting.sub ?? "",
  };
}
