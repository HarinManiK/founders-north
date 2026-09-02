// ---------------------------------------------------------------------------
// Founders North - Timezone Helpers (Default: Eastern Time / America/New_York)
// ---------------------------------------------------------------------------

export const TIMEZONE_ET = "America/New_York";
export const TIMEZONE_DEFAULT = TIMEZONE_ET;
export const TIMEZONE_IST = TIMEZONE_ET; // Alias for compatibility

/**
 * Returns exact year, month, day, hours, minutes, dateKey, and timeInMinutes in Eastern Time.
 */
export function getTimeInET(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_ET,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "00";

  const year = parseInt(getPart("year"), 10);
  const month = parseInt(getPart("month"), 10);
  const day = parseInt(getPart("day"), 10);
  const rawHour = parseInt(getPart("hour"), 10);
  const hours = rawHour === 24 ? 0 : rawHour;
  const minutes = parseInt(getPart("minute"), 10);
  const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const timeInMinutes = hours * 60 + minutes;

  return { year, month, day, hours, minutes, dateKey, timeInMinutes };
}

/**
 * Returns current Date.
 */
export function nowET(): Date {
  return new Date();
}
export const nowIST = nowET;

/**
 * Returns Date 24 hours ago.
 */
export function twentyFourHoursAgoET(): Date {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}
export const twentyFourHoursAgoIST = twentyFourHoursAgoET;

/**
 * Returns ISO string.
 */
export function toETString(date: Date = new Date()): string {
  return date.toISOString();
}
export const toISTString = toETString;

/**
 * Returns YYYY-MM-DD in Eastern Time (America/New_York).
 */
export function toETDateString(date: Date = new Date()): string {
  return getTimeInET(date).dateKey;
}
export const toISTDateString = toETDateString;

/**
 * Format a Date to human readable string like "September 2, 2026" in Eastern Time.
 */
export function toETHumanDate(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    timeZone: TIMEZONE_ET,
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
export const toISTHumanDate = toETHumanDate;

/**
 * Format a Date to full weekday + date in Eastern Time like "Wednesday, September 2, 2026".
 */
export function formatETDateLong(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    timeZone: TIMEZONE_ET,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
export const formatISTDateLong = formatETDateLong;

/**
 * Format a Date to medium format in Eastern Time like "September 2, 2026".
 */
export function formatETDateMedium(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    timeZone: TIMEZONE_ET,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
export const formatISTDateMedium = formatETDateMedium;

/**
 * Format a Date to short month/day like "Sep 2" in Eastern Time.
 */
export function formatETDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    timeZone: TIMEZONE_ET,
    month: "short",
    day: "numeric",
  });
}
export const formatISTDateShort = formatETDateShort;

/**
 * Format a Date to date and time in Eastern Time like "Sep 2, 2026, 5:15 AM".
 */
export function formatETDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    timeZone: TIMEZONE_ET,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
export const formatISTDateTime = formatETDateTime;

/**
 * Format time only in Eastern Time like "5:15:20 AM".
 */
export function formatETTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    timeZone: TIMEZONE_ET,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}
export const formatISTTime = formatETTime;


