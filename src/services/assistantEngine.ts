/**
 * Habify Assist — understands plain-language requests without an external AI service.
 * Pure functions only: parsing, intent detection and listing search, so it is easy to test
 * and could later be swapped for (or combined with) an LLM-backed endpoint.
 */
import { Property, PropertyType } from '../types';
import { RWANDA_LOCATIONS_DATA, RWANDA_DISTRICTS_BY_PROVINCE } from '../data/rwandaLocations';

export interface SearchCriteria {
  maxRent?: number;
  minRent?: number;
  minBedrooms?: number;
  propertyType?: PropertyType;
  furnished?: boolean;
  parking?: boolean;
  /** Canonical sector names (keys of RWANDA_LOCATIONS_DATA) */
  sectors: string[];
  districts: string[];
  provinces: string[];
  /** Canonical amenity labels as used on listings */
  amenities: string[];
}

export type Intent =
  | { kind: 'greeting' }
  | { kind: 'thanks' }
  | { kind: 'search'; criteria: SearchCriteria }
  | { kind: 'afford'; income?: number; rent?: number }
  | { kind: 'area'; sector: string }
  | { kind: 'this-home'; topic: 'match' | 'afford' | 'book' | 'similar' | 'general' }
  | { kind: 'my-viewings' }
  | { kind: 'my-messages' }
  | { kind: 'improve-listing' }
  | { kind: 'faq'; topic: FaqTopic }
  | { kind: 'unknown' };

export type FaqTopic =
  | 'signup' | 'signin' | 'roles' | 'match' | 'book' | 'save' | 'list'
  | 'messages' | 'coverage' | 'about' | 'theme' | 'report' | 'privacy';

// ---------------------------------------------------------------------------
// Numbers: "450k", "1.2m", "1,200,000", "1.2 million", "450 000 rwf"
// ---------------------------------------------------------------------------
const NUM = String.raw`(\d{1,3}(?:[ ,]\d{3})+|\d+(?:\.\d+)?)\s*(k|m|million|thousand)?`;

export function parseAmount(num: string, unit?: string): number {
  const n = parseFloat(num.replace(/[ ,]/g, ''));
  if (!Number.isFinite(n)) return NaN;
  const u = (unit || '').toLowerCase();
  if (u === 'k' || u === 'thousand') return Math.round(n * 1_000);
  if (u === 'm' || u === 'million') return Math.round(n * 1_000_000);
  // Bare small numbers in a rent context almost always mean thousands ("under 500")
  return n < 10_000 ? Math.round(n * 1_000) : Math.round(n);
}

const WORD_NUMS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, single: 1 };

const TYPES: Array<[RegExp, PropertyType]> = [
  [/\bstudios?\b/, 'STUDIO'],
  [/\bapartments?\b|\bflats?\b|\bcondos?\b/, 'APARTMENT'],
  [/\bvillas?\b|\bmansions?\b/, 'VILLA'],
  [/\btown\s?houses?\b/, 'TOWNHOUSE'],
  [/\bduplex(es)?\b/, 'DUPLEX'],
  [/\bhouses?\b|\bbungalows?\b/, 'HOUSE']
];

const AMENITY_ALIASES: Array<[RegExp, string]> = [
  [/wi-?fi|internet|fib(er|re)/, 'High-speed WiFi'],
  [/water\s*tank|water\s*pump|reservoir/, 'Water Tank & Pump'],
  [/generator|backup\s*power|power\s*backup|inverter/, 'Backup Generator'],
  [/security|guard|gated/, '24/7 Security Guard'],
  [/balcony|terrace|view/, 'Balcony'],
  [/garden|yard|lawn/, 'Garden'],
  [/pool|swimming/, 'Swimming Pool'],
  [/solar|hot\s*water\s*heater/, 'Solar Water Heater'],
  [/air\s*con|a\/c|\bac\b|cooling/, 'Air Conditioning'],
  [/washing\s*machine|laundry/, 'Washing Machine'],
  [/cctv|camera/, 'CCTV Surveillance'],
  [/gym|fitness/, 'Gym'],
  [/elevator|lift\b/, 'Elevator']
];

interface PlaceAlias { alias: string; sector: string }
const PLACE_ALIASES: PlaceAlias[] = Object.keys(RWANDA_LOCATIONS_DATA).flatMap(key => {
  const aliases = new Set<string>([key.toLowerCase()]);
  const base = key.replace(/\(.*?\)/g, '').replace(/\btown\b/i, '').trim().toLowerCase();
  if (base.length >= 4) aliases.add(base);
  const inner = key.match(/\(([^)]+)\)/)?.[1];
  inner?.split('/').forEach(part => {
    const p = part.replace(/\b(beach|lakeside|foothills|volcanoes)\b/gi, '').trim().toLowerCase();
    if (p.length >= 4) aliases.add(p);
  });
  return [...aliases].map(alias => ({ alias, sector: key }));
}).sort((a, b) => b.alias.length - a.alias.length);

const DISTRICTS = Object.values(RWANDA_DISTRICTS_BY_PROVINCE).flat();
const PROVINCE_ALIASES: Array<[RegExp, string]> = [
  [/\bkigali\b/, 'Kigali City'],
  [/\bnorth(ern)?\b/, 'Northern Province'],
  [/\bsouth(ern)?\b/, 'Southern Province'],
  [/\beast(ern)?\b/, 'Eastern Province'],
  [/\bwest(ern)?\b/, 'Western Province']
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function parseCriteria(raw: string): SearchCriteria {
  const q = ` ${raw.toLowerCase()} `;
  const c: SearchCriteria = { sectors: [], districts: [], provinces: [], amenities: [] };

  // Budget range: "between 300k and 600k", "300k-600k"
  const range = q.match(new RegExp(String.raw`(?:between|from)?\s*${NUM}\s*(?:-|to|and)\s*${NUM}`));
  const rangeIsBeds = range ? /^\s*\+?\s*-?\s*(bed|br|bd)/.test(q.slice((range.index ?? 0) + range[0].length)) : false;
  if (range && !rangeIsBeds && /between|from|-|to/.test(range[0]) && (range[2] || range[4] || /rwf|budget|rent/.test(q))) {
    c.minRent = parseAmount(range[1], range[2] || range[4]);
    c.maxRent = parseAmount(range[3], range[4]);
  } else {
    const max = q.match(new RegExp(String.raw`(?:under|below|less than|max(?:imum)?|up to|within|budget(?: of| is)?|cheaper than|<)\s*(?:rwf\s*)?${NUM}`));
    if (max) c.maxRent = parseAmount(max[1], max[2]);
    const min = q.match(new RegExp(String.raw`(?:over|above|more than|at least|min(?:imum)?|>)\s*(?:rwf\s*)?${NUM}`));
    if (min && !/bed/.test(q.slice(q.indexOf(min[0]), q.indexOf(min[0]) + min[0].length + 6))) {
      c.minRent = parseAmount(min[1], min[2]);
    }
    // A bare "450k" or "1.2m" with no other money word still reads as a budget
    if (!max && !min) {
      const bare = q.match(/\b(\d+(?:\.\d+)?)\s*(k|m)\b/);
      if (bare) c.maxRent = parseAmount(bare[1], bare[2]);
    }
  }

  // Bedrooms: "2 bed", "3+ bedrooms", "two-bedroom", "2br"
  const bedRange = q.match(/\b(\d)\s*(?:-|to)\s*\d\s*(?:bed(?:room)?s?|br|bd)\b/);
  const beds = bedRange ?? q.match(/\b(\d|one|two|three|four|five|six|single)\s*\+?\s*-?\s*(?:bed(?:room)?s?|br|bd)\b/);
  if (beds) c.minBedrooms = WORD_NUMS[beds[1]] ?? parseInt(beds[1], 10);

  for (const [re, type] of TYPES) {
    if (re.test(q)) {
      c.propertyType = type;
      break;
    }
  }
  if (c.propertyType === 'STUDIO' && c.minBedrooms === undefined) c.minBedrooms = 0;

  if (/\bunfurnished\b/.test(q)) c.furnished = false;
  else if (/\bfurnished\b/.test(q)) c.furnished = true;
  if (/\bparking\b|\bgarage\b|\bcar\b/.test(q)) c.parking = true;

  for (const [re, label] of AMENITY_ALIASES) if (re.test(q)) c.amenities.push(label);

  // Places: most specific first, never re-match inside an already matched alias
  let rest = q;
  for (const { alias, sector } of PLACE_ALIASES) {
    const re = new RegExp(`\\b${escape(alias)}\\b`);
    if (re.test(rest)) {
      if (!c.sectors.includes(sector)) c.sectors.push(sector);
      rest = rest.replace(re, ' ');
    }
  }
  for (const d of DISTRICTS) {
    if (new RegExp(`\\b${d.toLowerCase()}\\b`).test(rest) && !c.sectors.some(s => RWANDA_LOCATIONS_DATA[s]?.district === d)) {
      c.districts.push(d);
    }
  }
  if (!c.sectors.length && !c.districts.length) {
    for (const [re, prov] of PROVINCE_ALIASES) if (re.test(rest)) c.provinces.push(prov);
  }
  return c;
}

export function hasCriteria(c: SearchCriteria): boolean {
  return (
    c.maxRent !== undefined ||
    c.minRent !== undefined ||
    c.minBedrooms !== undefined ||
    !!c.propertyType ||
    c.furnished !== undefined ||
    !!c.parking ||
    c.sectors.length + c.districts.length + c.provinces.length + c.amenities.length > 0
  );
}

export function describeCriteria(c: SearchCriteria): string {
  const parts: string[] = [];
  if (c.minBedrooms) parts.push(`${c.minBedrooms}+ bedroom`);
  if (c.furnished === true) parts.push('furnished');
  if (c.furnished === false) parts.push('unfurnished');
  parts.push(c.propertyType ? c.propertyType.toLowerCase() + 's' : 'homes');
  const places = [...c.sectors.map(s => s.replace(/\s*\(.*\)/, '')), ...c.districts, ...c.provinces];
  if (places.length) parts.push(`in ${places.join(' or ')}`);
  if (c.minRent && c.maxRent) parts.push(`between ${fmt(c.minRent)} and ${fmt(c.maxRent)} RWF`);
  else if (c.maxRent) parts.push(`under ${fmt(c.maxRent)} RWF`);
  else if (c.minRent) parts.push(`over ${fmt(c.minRent)} RWF`);
  const extras = [...(c.parking ? ['parking'] : []), ...c.amenities.map(a => a.toLowerCase())];
  if (extras.length) parts.push(`with ${extras.join(', ')}`);
  return parts.join(' ');
}

export const fmt = (n: number) =>
  n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${Math.round(n / 1_000)}k` : String(n);

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
function matchesPlace(p: Property, c: SearchCriteria) {
  if (!c.sectors.length && !c.districts.length && !c.provinces.length) return true;
  // Older listings may not store district/province; derive them from the sector
  const info = RWANDA_LOCATIONS_DATA[p.locationSector];
  const district = p.district || info?.district;
  const province = p.province || info?.province;
  return (
    c.sectors.includes(p.locationSector) ||
    (!!district && c.districts.includes(district)) ||
    (!!province && c.provinces.includes(province)) ||
    c.sectors.some(s => RWANDA_LOCATIONS_DATA[s]?.district === p.district && p.locationSector.toLowerCase().includes(s.split(' ')[0].toLowerCase()))
  );
}

function hasAmenity(p: Property, label: string) {
  const want = label.toLowerCase().split(/\s+/)[0];
  return p.amenities.some(a => a.toLowerCase().includes(want));
}

export function searchListings(all: Property[], c: SearchCriteria): Property[] {
  return all.filter(
    p =>
      p.isAvailable &&
      (c.maxRent === undefined || p.monthlyRent <= c.maxRent) &&
      (c.minRent === undefined || p.monthlyRent >= c.minRent) &&
      (c.minBedrooms === undefined || p.bedrooms >= c.minBedrooms) &&
      (!c.propertyType || p.propertyType === c.propertyType) &&
      (c.furnished === undefined || p.isFurnished === c.furnished) &&
      (!c.parking || p.hasParking) &&
      c.amenities.every(a => hasAmenity(p, a)) &&
      matchesPlace(p, c)
  );
}

/** When nothing matches, drop the constraint that hurts most and report which one. */
export function relax(all: Property[], c: SearchCriteria): { results: Property[]; dropped: string } | null {
  const attempts: Array<[string, SearchCriteria]> = [];
  if (c.maxRent) attempts.push([`a budget up to ${fmt(Math.round(c.maxRent * 1.3))} RWF`, { ...c, maxRent: Math.round(c.maxRent * 1.3) }]);
  if (c.amenities.length) attempts.push(['without the must-have features', { ...c, amenities: [] }]);
  if (c.propertyType) attempts.push(['any property type', { ...c, propertyType: undefined }]);
  if (c.furnished !== undefined) attempts.push(['furnished or not', { ...c, furnished: undefined }]);
  if (c.minBedrooms) attempts.push([`${Math.max(1, c.minBedrooms - 1)}+ bedrooms`, { ...c, minBedrooms: Math.max(1, c.minBedrooms - 1) }]);
  if (c.sectors.length || c.districts.length || c.provinces.length) {
    attempts.push(['anywhere in Rwanda', { ...c, sectors: [], districts: [], provinces: [] }]);
  }
  for (const [dropped, relaxed] of attempts) {
    const results = searchListings(all, relaxed);
    if (results.length) return { results, dropped };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Intent detection
// ---------------------------------------------------------------------------
export function detectIntent(raw: string, ctx: { onPropertyPage: boolean }): Intent {
  const q = raw.toLowerCase().trim();
  if (!q) return { kind: 'unknown' };

  if (/^(hi|hello|hey|muraho|mwiriwe|mwaramutse|good\s*(morning|afternoon|evening))\b/.test(q)) return { kind: 'greeting' };
  if (/^(thanks|thank you|murakoze|cheers|great|ok(ay)?|perfect)\b/.test(q)) return { kind: 'thanks' };

  // Questions about the listing being viewed
  if (ctx.onPropertyPage && /\b(this|it|here)\b|this (home|house|place|listing|one)/.test(q)) {
    if (/match|score|why|fit/.test(q)) return { kind: 'this-home', topic: 'match' };
    if (/afford|budget|income|expensive|cheap/.test(q)) return { kind: 'this-home', topic: 'afford' };
    if (/book|view(ing)?|visit|tour|see it/.test(q)) return { kind: 'this-home', topic: 'book' };
    if (/similar|like this|alternatives?|other/.test(q)) return { kind: 'this-home', topic: 'similar' };
    return { kind: 'this-home', topic: 'general' };
  }

  // Affordability: income and/or rent
  const income = q.match(new RegExp(String.raw`(?:earn|salary|income|make|paid|get paid|net)\D{0,15}${NUM}`));
  if (/afford|salary|income|earn\b|30\s*%|how much (rent|can)/.test(q)) {
    const rentMatch = q.match(new RegExp(String.raw`(?:rent(?: of)?|afford|pay)\D{0,10}${NUM}`));
    return {
      kind: 'afford',
      income: income ? parseAmount(income[1], income[2]) : undefined,
      rent: rentMatch && (!income || rentMatch.index !== income.index) ? parseAmount(rentMatch[1], rentMatch[2]) : undefined
    };
  }

  // Personal status
  if (/\bmy (viewings?|visits?|tours?|bookings?|requests?)\b|viewing status|pending (viewings?|requests?)/.test(q)) return { kind: 'my-viewings' };
  if (/\bmy (messages?|inbox|inquiries|replies)\b|any (replies|messages)|did .* reply|unread/.test(q)) return { kind: 'my-messages' };
  if (/improve|better|quality|more (views|inquiries)|optimi[sz]e/.test(q) && /listing|property|post|ad\b/.test(q)) return { kind: 'improve-listing' };

  // "Tell me about Kimihurura"
  const about = q.match(/(?:about|tell me about|what is|what's|how is|describe|info on)\s+(.+)/);
  if (about) {
    const c = parseCriteria(about[1]);
    if (c.sectors.length === 1 && !c.maxRent && !c.minBedrooms && !c.propertyType) return { kind: 'area', sector: c.sectors[0] };
  }

  // FAQ (checked before generic search so "how do I list a home" isn't a search)
  if (/sign\s*up|register|create (an )?account|get started|join/.test(q)) return { kind: 'faq', topic: 'signup' };
  if (/log\s*in|sign\s*in|password|forgot/.test(q)) return { kind: 'faq', topic: 'signin' };
  if (/(how|where|can i).*(list|add|publish|post|advertise)|become a landlord|i('m| am) a landlord/.test(q)) return { kind: 'faq', topic: 'list' };
  if (/(how|where).*(book|schedule|request).*(view|visit|tour)|how do viewings work/.test(q)) return { kind: 'faq', topic: 'book' };
  if (/smart\s*match|match (score|%)|how.*(match|score|rank)/.test(q)) return { kind: 'faq', topic: 'match' };
  if (/(save|favou?rite|heart|wishlist)/.test(q)) return { kind: 'faq', topic: 'save' };
  if (/(contact|message|reach|talk to|call).*(landlord|owner|agent)/.test(q)) return { kind: 'faq', topic: 'messages' };
  if (/report|scam|fraud|fake|suspicious/.test(q)) return { kind: 'faq', topic: 'report' };
  if (/dark mode|light mode|theme/.test(q)) return { kind: 'faq', topic: 'theme' };
  if (/privacy|data|personal information|secure/.test(q)) return { kind: 'faq', topic: 'privacy' };
  if (/tenant|landlord|landlady|admin|roles?\b|account types?/.test(q)) return { kind: 'faq', topic: 'roles' };
  if (/where|which (areas|cities|places)|cover|provinces?/.test(q) && !/\b(find|show|looking)\b/.test(q)) return { kind: 'faq', topic: 'coverage' };
  if (/what (is|does) habify|who are you|what can you do|help\b/.test(q)) return { kind: 'faq', topic: 'about' };

  // Search
  const criteria = parseCriteria(q);
  if (hasCriteria(criteria) || /\b(find|show|search|looking for|need|want|any|homes?|houses?|apartments?|place to (live|stay)|rent)\b/.test(q)) {
    return { kind: 'search', criteria };
  }
  return { kind: 'unknown' };
}

export const FAQ: Record<FaqTopic, string> = {
  signup: 'Tap “Get started”, add your name, email and a password (at least 8 characters), then choose whether you’re looking for a home or listing one. You’ll land on your own dashboard straight away.',
  signin: 'Use “Sign in” with the email and password you registered with. If you’ve forgotten your password, contact the Habify team — self-service resets aren’t available yet.',
  roles: 'There are three kinds of account. Tenants search, save homes and book viewings. Landlords and landladies list homes and manage viewings, rent and leases in the Owner hub. Admins moderate reports.',
  match: 'Every home gets a 0–100 score against your budget, preferred areas, bedrooms, property type and must-have features. Budget and location count most. Open any home to see the breakdown, including trade-offs.',
  book: 'Open a home and tap “Book a viewing”, then pick a date and time slot. The landlord approves or declines it, and you’ll see the status on your dashboard and in Messages. You need a tenant account.',
  save: 'Tap the heart on any home to save it. Your saved homes stay on your account and appear under “Saved”.',
  list: 'Create a landlord account (or sign in as one), then use “List a home”. Add the location, rent, photos and amenities — a live quality score shows what to add to get more viewings.',
  messages: 'Open the home and tap “Ask the landlord”. Replies appear in Messages, and landlords see new questions in their Owner hub.',
  coverage: 'Habify lists homes across Rwanda: Kigali (Gasabo, Kicukiro, Nyarugenge) plus Musanze, Rubavu, Huye, Bugesera and other districts in all five provinces.',
  about: 'I’m Habify Assist. I can find homes from a plain description (“2-bed in Kimihurura under 500k with parking”), check what you can afford, explain match scores, tell you about neighborhoods, and show your viewings and messages.',
  theme: 'Use the sun/moon button at the top of the page. Habify follows your device’s setting until you pick one.',
  report: 'If a listing looks wrong or suspicious, open it and choose “Report this listing” at the bottom. Admins review every report. Never pay a deposit before you’ve visited the home.',
  privacy: 'Your password is stored as a secure one-way hash, and only you can see your saved homes, viewings and messages. Landlords see your name and email only when you contact them or book a viewing.'
};
