export const CONVERSION_CHAR_LIMIT = 3000;
export const CONVERSION_DAILY_LIMIT = 30;

const GUEST_KEY = 'conversion-usage:guest';

export type ConversionDirection = 'cantonese' | 'japanese';
export type ConversionLimitReason = 'chars' | 'daily';

type GuestUsage = { chars: number; days: Record<string, number> };

export function hongKongDayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function hongKongDayStartIso(date = new Date()) {
  return new Date(`${hongKongDayKey(date)}T00:00:00+08:00`).toISOString();
}

function emptyGuestUsage(): GuestUsage {
  return { chars: 0, days: {} };
}

export function readGuestUsage(): GuestUsage {
  if (typeof window === 'undefined') return emptyGuestUsage();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(GUEST_KEY) || '');
    if (!parsed || typeof parsed.chars !== 'number' || typeof parsed.days !== 'object' || !parsed.days) {
      return emptyGuestUsage();
    }
    return { chars: parsed.chars, days: parsed.days };
  } catch {
    return emptyGuestUsage();
  }
}

export function guestUsageToday(usage = readGuestUsage()) {
  return usage.days[hongKongDayKey()] ?? 0;
}

export function recordGuestUsage(charCount: number): ConversionLimitReason | 'ok' {
  const usage = readGuestUsage();
  const day = hongKongDayKey();
  const daily = usage.days[day] ?? 0;
  if (usage.chars + charCount > CONVERSION_CHAR_LIMIT) return 'chars';
  if (daily >= CONVERSION_DAILY_LIMIT) return 'daily';
  usage.chars += charCount;
  usage.days[day] = daily + 1;
  window.localStorage.setItem(GUEST_KEY, JSON.stringify(usage));
  return 'ok';
}
