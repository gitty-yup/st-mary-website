// Browser-safe: the Hokihankist (Requiem Service) request form's fields and rules, used by the
// form (to show problems straight away) and by the server (which decides).

export const OCCASIONS = [
  { value: 'yotnorek', label: 'Yotnorek – seventh day' },
  { value: 'karasoonk', label: 'Karasoonk – fortieth day' },
  { value: 'darelits', label: 'Darelits – anniversary' },
  { value: 'other', label: 'Other remembrance' },
] as const;
export type Occasion = (typeof OCCASIONS)[number]['value'];

export const occasionLabel = (v: string) => OCCASIONS.find((o) => o.value === v)?.label ?? v;

/** At most this many departed loved ones in one request. */
export const MAX_NAMES = 10;

export interface RemembranceInput {
  name: string;
  relationship: string;
  occasion: string;
}

export interface RequiemInput {
  serviceDate: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  others: string;
  names: RemembranceInput[];
  newsletter: boolean;
}

export const emptyRemembrance = (): RemembranceInput => ({ name: '', relationship: '', occasion: '' });

/** Today's date in Costa Mesa (YYYY-MM-DD), whatever the visitor's or server's time zone. */
export function parishToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

/** Easter Sunday (Gregorian), which the Armenian Church observes. */
export function easter(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(year, month, day);
}

/** The Sunday falling within `from`–`from + 6` (the Sunday nearest a feast's date). */
function sundayFrom(year: number, month: number, from: number): Date {
  const start = utc(year, month, from);
  return addDays(start, (7 - start.getUTCDay()) % 7);
}

/**
 * The five major Tabernacle Feasts (Daghavar Doner) in a year, when Hokihankist is not
 * performed: Nativity and Theophany (January 6), Easter, Transfiguration (Vartavar, 98 days
 * after Easter), Assumption (the Sunday nearest August 15) and Exaltation of the Holy Cross
 * (the Sunday nearest September 14).
 */
export function majorFeasts(year: number): { date: string; name: string }[] {
  const e = easter(year);
  return [
    { date: iso(utc(year, 1, 6)), name: 'Holy Nativity and Theophany (Armenian Christmas)' },
    { date: iso(e), name: 'Holy Resurrection (Easter)' },
    { date: iso(addDays(e, 98)), name: 'the Transfiguration (Vartavar)' },
    { date: iso(sundayFrom(year, 8, 12)), name: 'the Assumption of the Holy Mother of God' },
    { date: iso(sundayFrom(year, 9, 11)), name: 'the Exaltation of the Holy Cross' },
  ];
}

/** Why a date can't be chosen for the service, or null if it can. */
export function serviceDateProblem(date: string, today: string = parishToday()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Choose the date of the service.';
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || iso(d) !== date) return 'Choose the date of the service.';
  if (d.getUTCDay() !== 0) return 'Hokihankist is offered on Sundays. Please choose a Sunday.';
  if (date <= today) return 'Please send your request at least one day before the service.';
  if (date > iso(addDays(new Date(`${today}T00:00:00Z`), 366))) return 'Please choose a Sunday within the next year.';
  const feast = majorFeasts(d.getUTCFullYear()).find((f) => f.date === date);
  if (feast) return `Hokihankist isn’t offered on the Feast of ${feast.name}. Please choose another Sunday.`;
  return null;
}

/** The next Sundays a request can be made for (for the date picker's suggestions). */
export function nextServiceSundays(count: number, today: string = parishToday()): string[] {
  const out: string[] = [];
  let d = addDays(new Date(`${today}T00:00:00Z`), 1);
  d = addDays(d, (7 - d.getUTCDay()) % 7);
  while (out.length < count) {
    if (!serviceDateProblem(iso(d), today)) out.push(iso(d));
    d = addDays(d, 7);
  }
  return out;
}

const LIMITS = { name: 120, address: 200, city: 80, state: 40, zip: 10, phone: 40, email: 200, others: 1000, relationship: 80 };
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Tidies and checks a request. `errors` is keyed by field (`names.0.name` for a row),
 * empty when the request can be sent. Rows left completely blank are dropped.
 */
export function cleanRequiem(raw: unknown, today: string = parishToday()): { data: RequiemInput; errors: Record<string, string> } {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const rows = Array.isArray(r.names) ? r.names.slice(0, MAX_NAMES + 5) : [];
  const data: RequiemInput = {
    serviceDate: clean(r.serviceDate, 10),
    name: clean(r.name, LIMITS.name),
    address: clean(r.address, LIMITS.address),
    city: clean(r.city, LIMITS.city),
    state: clean(r.state, LIMITS.state),
    zip: clean(r.zip, LIMITS.zip),
    phone: clean(r.phone, LIMITS.phone),
    email: clean(r.email, LIMITS.email).toLowerCase(),
    others: typeof r.others === 'string' ? r.others.trim().slice(0, LIMITS.others) : '',
    names: rows
      .map((x) => {
        const row = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
        return { name: clean(row.name, LIMITS.name), relationship: clean(row.relationship, LIMITS.relationship), occasion: clean(row.occasion, 20) };
      })
      .filter((x) => x.name || x.relationship || x.occasion),
    newsletter: r.newsletter === true,
  };
  const errors: Record<string, string> = {};
  const dateProblem = serviceDateProblem(data.serviceDate, today);
  if (dateProblem) errors.serviceDate = dateProblem;
  if (!data.name) errors.name = 'Enter your name.';
  if (!data.address) errors.address = 'Enter your street address.';
  if (!data.city) errors.city = 'Enter your city.';
  if (!data.state) errors.state = 'Enter your state.';
  if (!/^\d{5}(-\d{4})?$/.test(data.zip)) errors.zip = 'Enter a 5-digit ZIP code.';
  if (data.phone.replace(/\D/g, '').length < 10) errors.phone = 'Enter a phone number, including the area code.';
  if (!EMAIL.test(data.email)) errors.email = 'Enter an email address.';
  if (!data.names.length) errors['names.0.name'] = 'Enter the name of your departed loved one.';
  if (data.names.length > MAX_NAMES) errors.names = `Please list at most ${MAX_NAMES} names in one request.`;
  data.names.forEach((n, i) => {
    if (!n.name) errors[`names.${i}.name`] = 'Enter the name.';
    if (!n.relationship) errors[`names.${i}.relationship`] = 'Enter the relationship.';
    if (!OCCASIONS.some((o) => o.value === n.occasion)) errors[`names.${i}.occasion`] = 'Choose the occasion.';
  });
  return { data, errors };
}

/** "Sunday, December 7, 2026" */
export function longDate(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? date
    : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
