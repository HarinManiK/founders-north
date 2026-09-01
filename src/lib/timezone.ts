// ---------------------------------------------------------------------------
// Founders North - IST Timezone Helpers (Asia/Kolkata)
// ---------------------------------------------------------------------------

export const TIMEZONE_IST = "Asia/Kolkata";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/**
 * Returns the current date/time in IST.
 */
export function nowIST(): Date {
  return new Date(Date.now() + IST_OFFSET_MS);
}

/**
 * Returns a Date object representing 24 hours ago in IST.
 */
export function twentyFourHoursAgoIST(): Date {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

/**
 * Format a Date to an ISO string preserving IST context (+05:30).
 */
export function toISTString(date: Date): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const year = ist.getUTCFullYear();
  const month = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const day = String(ist.getUTCDate()).padStart(2, "0");
  const hours = String(ist.getUTCHours()).padStart(2, "0");
  const minutes = String(ist.getUTCMinutes()).padStart(2, "0");
  const seconds = String(ist.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+05:30`;
}

/**
 * Format a Date to YYYY-MM-DD in IST.
 */
export function toISTDateString(date: Date): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const year = ist.getUTCFullYear();
  const month = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const day = String(ist.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date to a human readable string in IST like "September 2, 2026".
 */
export function toISTHumanDate(date: Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    timeZone: TIMEZONE_IST,
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a Date to full weekday + date in IST like "Wednesday, September 2, 2026".
 */
export function formatISTDateLong(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    timeZone: TIMEZONE_IST,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format a Date to medium format in IST like "September 2, 2026".
 */
export function formatISTDateMedium(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    timeZone: TIMEZONE_IST,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format a Date to short month/day like "Sep 2" in IST.
 */
export function formatISTDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    timeZone: TIMEZONE_IST,
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a Date to date and time in IST like "Sep 2, 2026, 5:15 AM".
 */
export function formatISTDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    timeZone: TIMEZONE_IST,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format time only in IST like "5:15:20 AM".
 */
export function formatISTTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    timeZone: TIMEZONE_IST,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

