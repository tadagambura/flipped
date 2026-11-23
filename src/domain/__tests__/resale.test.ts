import { daysListed, monthSummary, profit, recentMonths, reportingStatus, suggestedFee, taxYearOf, toCSV, tradingIncome, type Item } from '../resale';

const item = (o: Partial<Item> = {}): Item => ({ id: Math.random().toString(), name: 'Jacket', platform: 'vinted', cost: 500, listedOn: '2026-10-01', forResale: true, ...o });
const sold = (day: string, price: number, extra: Partial<Item> = {}) => item({ sold: { day, price, fees: 0, postage: 0 }, ...extra });

test('profit = price − fees − postage − cost', () => {
  expect(profit(item({ cost: 400, sold: { day: '2026-11-01', price: 2000, fees: 88, postage: 300 } }))).toBe(1212);
  expect(profit(item())).toBeNull();
});

test('fee presets: Vinted and eBay sellers pay nothing, Depop 2.9% + 30p on item + postage', () => {
  expect(suggestedFee('vinted', 2000)).toBe(0);
  expect(suggestedFee('ebay', 2000)).toBe(0);
  expect(suggestedFee('depop', 2000, 350)).toBe(Math.round(2350 * 0.029) + 30);
});

test('days listed stops counting when sold', () => {
  expect(daysListed(item({ listedOn: '2026-11-01' }), '2026-11-23')).toBe(22);
  expect(daysListed(sold('2026-11-05', 100, { listedOn: '2026-11-01' }), '2026-11-23')).toBe(4);
});

test('month summary', () => {
  const items = [sold('2026-11-02', 2000, { cost: 500 }), sold('2026-11-20', 1500, { cost: 0 }), sold('2026-10-30', 999), item()];
  expect(monthSummary(items, '2026-11')).toMatchObject({ sold: 2, revenue: 3500, cost: 500, profit: 3000 });
  expect(recentMonths('2026-02-10', 4)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
});

test('HMRC reporting: 30 sales OR more than ~£1,700, counted per platform per calendar year', () => {
  const vinted29 = Array.from({ length: 29 }, () => sold('2026-03-01', 1000));
  let s = reportingStatus(vinted29, 2026);
  expect(s).toHaveLength(1);
  expect(s[0]).toMatchObject({ platform: 'vinted', sales: 29, reportable: false });
  s = reportingStatus([...vinted29, sold('2026-12-31', 1000)], 2026);
  expect(s[0].reportable).toBe(true);
  // Money test, on another platform, independent of Vinted
  s = reportingStatus([sold('2026-05-01', 170_000, { platform: 'ebay' }), sold('2026-05-02', 1, { platform: 'ebay' })], 2026);
  expect(s[0]).toMatchObject({ platform: 'ebay', sales: 2, reportable: true });
  // Last year's sales don't count
  expect(reportingStatus([sold('2025-12-31', 999_999)], 2026)).toEqual([]);
  // "Other" sites aren't tracked
  expect(reportingStatus([sold('2026-01-01', 999_999, { platform: 'other' })], 2026)).toEqual([]);
});

test('trading income uses the tax year and only items bought to resell', () => {
  expect(taxYearOf('2027-04-05').label).toBe('2026/27');
  expect(taxYearOf('2027-04-06').label).toBe('2027/28');
  const items = [sold('2026-04-05', 5000), sold('2026-04-06', 3000), sold('2027-01-10', 2000, { forResale: false })];
  expect(tradingIncome(items, '2026-11-23')).toBe(3000);
});

test('CSV escapes commas and quotes', () => {
  const csv = toCSV([sold('2026-11-01', 1234, { name: 'Coat, "vintage"', cost: 200 })]);
  expect(csv.split('\n')[1]).toBe('"Coat, ""vintage""",Vinted,yes,2026-10-01,2.00,2026-11-01,12.34,0.00,0.00,10.34');
});
