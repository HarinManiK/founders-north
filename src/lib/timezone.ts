// ---------------------------------------------------------------------------
// Founders North - IST Timezone Helpers
// ---------------------------------------------------------------------------

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/**
 * Returns the current date/time in IST as a Date object (still UTC internally,
 * but shifted so getUTC* methods return IST values).
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
 * Format a Date to an ISO string preserving IST context.
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
 * Format a Date to a human readable string in IST like "September 1, 2026".
 */
export function toISTHumanDate(date: Date): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[ist.getUTCMonth()]} ${ist.getUTCDate()}, ${ist.getUTCFullYear()}`;
}
