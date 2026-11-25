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

/** How a family would like to make the (optional) memorial offering. */
export const OFFERINGS = [
  { value: 'online', label: 'Online', help: 'We’ll show you the link to our secure giving page once your request is sent.' },
  { value: 'church', label: 'At church on Sunday', help: '' },
] as const;
/** 'enclosed' only on paper forms (entered by the office). */
export type Offering = '' | (typeof OFFERINGS)[number]['value'] | 'enclosed';

export function offeringLabel(v: string): string {
  return v === 'online' ? 'Online' : v === 'church' ? 'At church' : v === 'enclosed' ? 'Enclosed with the paper form' : '';
}

export const GIVE_ONLINE_URL = 'https://give.tithe.ly/?formId=2b4b2f59-428d-46ab-9cd4-b151b1f12dab';

export interface RemembranceInput {
  name: string;
  relationship: string;
  occasion: string;
  /** Darelits: which anniversary of the passing (1, 2, 3, …). */
  anniversary: string;
  /** Other remembrance: what the occasion is. */
  details: string;
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
  /** Someone from the church should contact them about a memorial meal… */
  hokijash: boolean;
  /** …or about sponsoring the Sunday fellowship (coffee) hour. */
  fellowship: boolean;
  /** Anything the family wants us to know about those arrangements. */
  arrangements: string;
  offering: Offering;
}

export const emptyRemembrance = (): RemembranceInput => ({ name: '', relationship: '', occasion: '', anniversary: '', details: '' });

/** 1 → "1st", 2 → "2nd", 11 → "11th", 22 → "22nd" */
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/** The occasion as people would say it: "Karasoonk – fortieth day", "Darelits – 5th anniversary", "Other – her birthday". */
export function remembranceLabel(n: Pick<RemembranceInput, 'occasion' | 'anniversary' | 'details'>): string {
  if (n.occasion === 'darelits' && n.anniversary) return `Darelits – ${ordinal(Number(n.anniversary))} anniversary`;
  if (n.occasion === 'other' && n.details) return `Other – ${n.details}`;
  return occasionLabel(n.occasion);
}

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

/** Merelots: the day after each of the five major feasts, a day of remembrance of the departed. */
export function isMerelots(date: string): boolean {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  const eve = iso(addDays(d, -1));
  return majorFeasts(Number(eve.slice(0, 4))).some((f) => f.date === eve);
}

/** "Sunday, November 29, 2026", or "Monday, March 29, 2027 (Merelots)". */
export function serviceDateLabel(date: string): string {
  return isMerelots(date) ? `${longDate(date)} (Merelots)` : longDate(date);
}

/** Same-day requests (from the parish office's QR code or link) close at this hour, parish time. */
export const SAME_DAY_CUTOFF_HOUR = 13;
export const SAME_DAY_CUTOFF_LABEL = '1:00 pm';

export interface DateRules {
  /** The office's same-day QR code or link was used, and same-day requests are open (`sameDayOpen`). */
  sameDay?: boolean;
  /** Entered by the parish office (a paper form): today is always allowed. */
  office?: boolean;
}

/** Why a date can't be chosen for the service, or null if it can. */
export function serviceDateProblem(date: string, today: string = parishToday(), rules: DateRules = {}): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Choose the date of the service.';
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || iso(d) !== date) return 'Choose the date of the service.';
  const merelots = isMerelots(date);
  if (d.getUTCDay() !== 0 && !merelots) return 'Hokihankist is offered on Sundays and on Merelots days. Please choose a Sunday.';
  if (date < today) return 'That date has passed. Please choose an upcoming Sunday.';
  const feast = majorFeasts(d.getUTCFullYear()).find((f) => f.date === date);
  if (feast && !merelots) return `Hokihankist isn’t offered on the Feast of ${feast.name}. Please choose another Sunday.`;
  if (date === today && !rules.sameDay && !rules.office) {
    return 'Requests need to be made at least one day before the service. For a request today, please stop by the parish office.';
  }
  if (date > iso(addDays(new Date(`${today}T00:00:00Z`), 366))) return 'Please choose a Sunday within the next year.';
  return null;
}

/** The hour (0–23) in Costa Mesa. */
function parishHour(now: Date): number {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', hourCycle: 'h23' }).format(now));
}

/**
 * Today's date if a same-day request can be made right now: today is a Sunday (not a major
 * feast) or a Merelots day, and it's before the cutoff. Otherwise null.
 */
export function sameDayOpen(now: Date = new Date()): string | null {
  const today = parishToday(now);
  if (parishHour(now) >= SAME_DAY_CUTOFF_HOUR) return null;
  return serviceDateProblem(today, today, { sameDay: true }) ? null : today;
}

/** The next days a request can be made for (for the date picker's suggestions): Sundays and Merelots days. */
export function nextServiceDays(count: number, today: string = parishToday()): string[] {
  const out: string[] = [];
  let d = addDays(new Date(`${today}T00:00:00Z`), 1);
  for (let i = 0; i < 400 && out.length < count; i++, d = addDays(d, 1)) {
    if (!serviceDateProblem(iso(d), today)) out.push(iso(d));
  }
  return out;
}

const LIMITS = { name: 120, address: 200, city: 80, state: 40, zip: 10, phone: 40, email: 200, others: 1000, relationship: 80, details: 120, arrangements: 1000 };
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Tidies and checks a request. `errors` is keyed by field (`names.0.name` for a row),
 * empty when the request can be sent. Rows left completely blank are dropped.
 * Office entries (paper forms) need only a phone number or an email, and may say the
 * offering was enclosed.
 */
export function cleanRequiem(
  raw: unknown,
  today: string = parishToday(),
  rules: DateRules = {},
): { data: RequiemInput; errors: Record<string, string> } {
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
        const occasion = clean(row.occasion, 20);
        return {
          name: clean(row.name, LIMITS.name),
          relationship: clean(row.relationship, LIMITS.relationship),
          occasion,
          // Kept only for the occasion it belongs to.
          anniversary: occasion === 'darelits' ? clean(String(row.anniversary ?? ''), 3) : '',
          details: occasion === 'other' ? clean(row.details, LIMITS.details) : '',
        };
      })
      .filter((x) => x.name || x.relationship || x.occasion),
    newsletter: r.newsletter === true,
    hokijash: r.hokijash === true,
    fellowship: r.fellowship === true,
    arrangements: '',
    offering:
      OFFERINGS.some((o) => o.value === r.offering) || (rules.office && r.offering === 'enclosed') ? (r.offering as Offering) : '',
  };
  if (data.hokijash || data.fellowship) data.arrangements = typeof r.arrangements === 'string' ? r.arrangements.trim().slice(0, LIMITS.arrangements) : '';
  const errors: Record<string, string> = {};
  const dateProblem = serviceDateProblem(data.serviceDate, today, rules);
  if (dateProblem) errors.serviceDate = dateProblem;
  if (!data.name) errors.name = rules.office ? 'Enter the name of the person requesting.' : 'Enter your name.';
  const badPhone = data.phone.replace(/\D/g, '').length < 10;
  const badZip = !/^\d{5}(-\d{4})?$/.test(data.zip);
  if (rules.office) {
    // A paper form may be incomplete: what's given must be valid, and the family must be reachable.
    if (data.phone && badPhone) errors.phone = 'Enter a phone number, including the area code.';
    if (data.email && !EMAIL.test(data.email)) errors.email = 'Enter a valid email address.';
    if (!data.phone && !data.email) errors.phone = 'Enter a phone number or an email address, so we can reach the family.';
    if (data.zip && badZip) errors.zip = 'Enter a 5-digit ZIP code.';
  } else {
    if (!data.address) errors.address = 'Enter your street address.';
    if (!data.city) errors.city = 'Enter your city.';
    if (!data.state) errors.state = 'Enter your state.';
    if (badZip) errors.zip = 'Enter a 5-digit ZIP code.';
    if (badPhone) errors.phone = 'Enter a phone number, including the area code.';
    if (!EMAIL.test(data.email)) errors.email = 'Enter an email address.';
  }
  if (!data.names.length) errors['names.0.name'] = 'Enter the name of your departed loved one.';
  if (data.names.length > MAX_NAMES) errors.names = `Please list at most ${MAX_NAMES} names in one request.`;
  data.names.forEach((n, i) => {
    if (!n.name) errors[`names.${i}.name`] = 'Enter the name.';
    if (!n.relationship) errors[`names.${i}.relationship`] = 'Enter the relationship.';
    if (!OCCASIONS.some((o) => o.value === n.occasion)) errors[`names.${i}.occasion`] = 'Choose the occasion.';
    if (n.occasion === 'darelits' && !(/^\d{1,3}$/.test(n.anniversary) && Number(n.anniversary) >= 1 && Number(n.anniversary) <= 150)) {
      errors[`names.${i}.anniversary`] = 'Enter which anniversary (for example, 1 for the first).';
    }
    if (n.occasion === 'other' && !n.details) errors[`names.${i}.details`] = 'Tell us the occasion.';
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
