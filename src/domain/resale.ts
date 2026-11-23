// Flipped: profit, stock and the HMRC platform-reporting thresholds.
// Rules are in docs/pilots/research/uk-rules-2026-27.md (checked 23 Nov 2026).
import { diffDays, monthKey, type DayKey } from '@/kit/dates';
import type { Pence } from '@/kit/money';

export type Platform = 'vinted' | 'ebay' | 'depop' | 'facebook' | 'other';

export const PLATFORMS: { value: Platform; label: string; reports: boolean }[] = [
  { value: 'vinted', label: 'Vinted', reports: true },
  { value: 'ebay', label: 'eBay', reports: true },
  { value: 'depop', label: 'Depop', reports: true },
  { value: 'facebook', label: 'Facebook', reports: true },
  { value: 'other', label: 'Other', reports: false },
];

export const platformLabel = (p: Platform) => PLATFORMS.find((x) => x.value === p)!.label;

export type Sale = { day: DayKey; price: Pence; fees: Pence; postage: Pence };

export type Item = {
  id: string;
  name: string;
  platform: Platform;
  cost: Pence;
  listedOn: DayKey;
  /** true = bought or made to sell (may count as trading). false = your own unwanted stuff. */
  forResale: boolean;
  sold?: Sale;
};

export const FEES_CHECKED = '2026-11-23';

/**
 * What the platform takes from the seller on a sale, as a starting suggestion.
 * Vinted and eBay (UK private sellers, fixed price) charge sellers nothing: the buyer pays.
 * Depop takes payment processing of 2.9% + 30p on item + postage. Always editable.
 */
export function suggestedFee(platform: Platform, price: Pence, postageCharged: Pence = 0): Pence {
  if (platform === 'depop') return Math.round((price + postageCharged) * 0.029) + 30;
  return 0;
}

export function feeNote(platform: Platform): string {
  switch (platform) {
    case 'vinted':
      return 'Vinted charges sellers no fee. The buyer pays the Vinted fee.';
    case 'ebay':
      return "eBay private sellers pay no selling fee in the UK. On offers and auctions the buyer's fee is taken out of the price, so enter what you actually received.";
    case 'depop':
      return 'Depop takes about 2.9% + 30p for payment processing. Boosted listings cost extra.';
    default:
      return 'Enter any fee the site took.';
  }
}

export function profit(i: Item): Pence | null {
  if (!i.sold) return null;
  return i.sold.price - i.sold.fees - i.sold.postage - i.cost;
}

export function daysListed(i: Item, today: DayKey): number {
  return Math.max(0, diffDays(i.listedOn, i.sold?.day ?? today));
}

export const DUSTY_DAYS = 60;

export type MonthSummary = { month: string; sold: number; revenue: Pence; fees: Pence; postage: Pence; cost: Pence; profit: Pence };

export function monthSummary(items: Item[], month: string): MonthSummary {
  const s: MonthSummary = { month, sold: 0, revenue: 0, fees: 0, postage: 0, cost: 0, profit: 0 };
  for (const i of items) {
    if (!i.sold || monthKey(i.sold.day) !== month) continue;
    s.sold++;
    s.revenue += i.sold.price;
    s.fees += i.sold.fees;
    s.postage += i.sold.postage;
    s.cost += i.cost;
  }
  s.profit = s.revenue - s.fees - s.postage - s.cost;
  return s;
}

/** The last n months, oldest first, including empty ones. */
export function recentMonths(today: DayKey, n: number): string[] {
  const [y, m] = today.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
}

// ---------- HMRC platform reporting ----------
// Platforms must report a seller to HMRC for a calendar year if they make 30 or more sales
// OR receive more than €2,000 (about £1,700) on that platform. Each platform counts separately.
export const REPORT_SALES = 30;
export const REPORT_APPROX_GBP: Pence = 170_000;

export type PlatformYear = { platform: Platform; sales: number; received: Pence; reportable: boolean; salesShare: number; moneyShare: number };

export function reportingStatus(items: Item[], year: number): PlatformYear[] {
  const by = new Map<Platform, { sales: number; received: Pence }>();
  for (const i of items) {
    if (!i.sold || !i.sold.day.startsWith(String(year))) continue;
    const cur = by.get(i.platform) ?? { sales: 0, received: 0 };
    cur.sales++;
    cur.received += i.sold.price;
    by.set(i.platform, cur);
  }
  return PLATFORMS.filter((p) => p.reports && by.has(p.value)).map((p) => {
    const { sales, received } = by.get(p.value)!;
    return {
      platform: p.value,
      sales,
      received,
      reportable: sales >= REPORT_SALES || received > REPORT_APPROX_GBP,
      salesShare: Math.min(1, sales / REPORT_SALES),
      moneyShare: Math.min(1, received / REPORT_APPROX_GBP),
    };
  });
}

// ---------- Trading allowance (tax year, 6 April to 5 April) ----------
export const TRADING_ALLOWANCE: Pence = 100_000; // £1,000 for 2026/27 (rising to £3,000 from 6 April 2027 if enacted)

export function taxYearOf(day: DayKey): { start: DayKey; end: DayKey; label: string } {
  const y = Number(day.slice(0, 4));
  const startYear = day.slice(5) >= '04-06' ? y : y - 1;
  return { start: `${startYear}-04-06`, end: `${startYear + 1}-04-05`, label: `${startYear}/${String(startYear + 1).slice(2)}` };
}

/** Gross takings from items bought or made to resell, in the tax year containing `today`. */
export function tradingIncome(items: Item[], today: DayKey): Pence {
  const ty = taxYearOf(today);
  return items
    .filter((i) => i.forResale && i.sold && diffDays(ty.start, i.sold.day) >= 0 && diffDays(i.sold.day, ty.end) >= 0)
    .reduce((s, i) => s + i.sold!.price, 0);
}

export function itemError(i: { name: string; cost: Pence | null }): string | null {
  if (!i.name.trim()) return 'What is it? A short name is fine.';
  if (i.cost == null) return 'Enter what you paid (0 if it was free).';
  return null;
}

export function saleError(s: { price: Pence | null; fees: Pence | null; postage: Pence | null }): string | null {
  if (s.price == null || s.price <= 0) return 'Enter what it sold for.';
  if (s.fees == null || s.postage == null) return 'Fees and postage can be 0, but not blank.';
  return null;
}

/** CSV for accountants and spreadsheets. */
export function toCSV(items: Item[]): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const p = (x: Pence) => (x / 100).toFixed(2);
  const rows = [['Item', 'Platform', 'For resale', 'Listed', 'Cost', 'Sold on', 'Price', 'Fees', 'Postage', 'Profit']];
  for (const i of items) {
    rows.push([i.name, platformLabel(i.platform), i.forResale ? 'yes' : 'no', i.listedOn, p(i.cost), i.sold?.day ?? '', i.sold ? p(i.sold.price) : '', i.sold ? p(i.sold.fees) : '', i.sold ? p(i.sold.postage) : '', i.sold ? p(profit(i)!) : '']);
  }
  return rows.map((r) => r.map(esc).join(',')).join('\n');
}
