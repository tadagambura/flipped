import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { formatDay, todayKey } from '@/kit/dates';
import { MoneyField } from '@/kit/inputs';
import { formatGBP, type Pence } from '@/kit/money';
import { useTheme } from '@/kit/theme';
import { Body, Button, Card, EmptyState, H1, H2, Label, Muted, Note, ProgressBar, Row, Screen, Section, Sheet, Stack, Stat, Strong } from '@/kit/ui';
import { monthSummary, platformLabel, recentMonths, REPORT_APPROX_GBP, REPORT_SALES, reportingStatus, taxYearOf, tradingIncome, TRADING_ALLOWANCE } from '@/domain/resale';
import { useItems } from '@/state/items';
import '@/arcade';
import { ArcadeEntry } from '@/kit/arcade/screens';

function Bars({ data }: { data: { label: string; value: Pence }[] }) {
  const { c, font } = useTheme();
  const max = Math.max(1, ...data.map((d) => Math.abs(d.value)));
  return (
    <Row style={{ alignItems: 'flex-end', height: 130, justifyContent: 'space-between' }} gap={6}>
      {data.map((d) => (
        <View key={d.label} style={{ flex: 1, alignItems: 'center', gap: 4 }} accessible accessibilityLabel={`${d.label}: ${formatGBP(d.value)} profit`}>
          <Text style={{ fontSize: 11, color: c.textMuted }}>{d.value ? formatGBP(d.value, { whole: true }).replace('.00', '') : ''}</Text>
          <View style={{ width: '70%', height: Math.max(3, (Math.abs(d.value) / max) * 90), borderRadius: 6, backgroundColor: d.value >= 0 ? c.primary : c.danger }} />
          <Text style={{ fontFamily: font.display, fontSize: 12, color: c.text }}>{d.label}</Text>
        </View>
      ))}
    </Row>
  );
}

export default function Profit() {
  const { c } = useTheme();
  const { items, goal, setGoal } = useItems();
  const [goalSheet, setGoalSheet] = useState(false);
  const [goalInput, setGoalInput] = useState<Pence | null>(goal);
  const today = todayKey();
  const month = today.slice(0, 7);
  const now = monthSummary(items, month);
  const months = recentMonths(today, 6).map((m) => ({ label: formatDay(`${m}-01`, 'month').slice(0, 3), value: monthSummary(items, m).profit }));
  const year = Number(today.slice(0, 4));
  const reporting = reportingStatus(items, year);
  const ty = taxYearOf(today);
  const trading = tradingIncome(items, today);

  if (!items.length) {
    return (
      <Screen testID="profit">
        <H1>Profit</H1>
        <EmptyState icon="pricetag-outline" title="Nothing logged yet" body="Add something you're selling. When it sells, Flipped works out the real profit." action={<Button title="Add an item" icon="add" onPress={() => router.push('/item/new')} testID="profit-add" />} />
      </Screen>
    );
  }

  return (
    <Screen testID="profit">
      <Stack gap={2}>
        <Muted>{formatDay(`${month}-01`, 'month')}</Muted>
        <H1>Profit</H1>
      </Stack>
      <Card tone="alt">
        <Label>This month</Label>
        <H1 testID="month-profit" color={now.profit < 0 ? c.danger : undefined}>{formatGBP(now.profit, { sign: now.profit > 0 })}</H1>
        <Row>
          <Stat label="Sold" value={String(now.sold)} />
          <Stat label="Takings" value={formatGBP(now.revenue, { whole: true })} />
          <Stat label="Fees + post" value={formatGBP(now.fees + now.postage, { whole: true })} />
        </Row>
        {goal ? (
          <Stack gap={6}>
            <ProgressBar value={now.profit / goal} label="Monthly profit goal" />
            <Muted>{now.profit >= goal ? `Goal of ${formatGBP(goal, { whole: true })} smashed. 🏄` : `${formatGBP(goal - now.profit)} to your ${formatGBP(goal, { whole: true })} goal.`}</Muted>
          </Stack>
        ) : null}
        <Button small variant="ghost" title={goal ? 'Change goal' : 'Set a monthly profit goal'} onPress={() => setGoalSheet(true)} testID="goal-open" />
      </Card>

      <Section title="Last 6 months">
        <Card>
          <Bars data={months} />
        </Card>
      </Section>

      <Section title={`HMRC reporting, ${year}`}>
        <Card testID="reporting">
          <Body>{`Sites send HMRC your sales details if you make ${REPORT_SALES} or more sales, or get more than about ${formatGBP(REPORT_APPROX_GBP, { whole: true })} (€2,000), on that site in a calendar year.`}</Body>
          {reporting.length === 0 ? <Muted>No sales on Vinted, eBay, Depop or Facebook yet this year.</Muted> : null}
          {reporting.map((r) => (
            <Stack key={r.platform} gap={6}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Strong>{platformLabel(r.platform)}</Strong>
                <Muted testID={`report-${r.platform}`}>{r.reportable ? 'Will be reported' : 'Under both limits'}</Muted>
              </Row>
              <ProgressBar value={r.salesShare} label={`${platformLabel(r.platform)} sales towards ${REPORT_SALES}`} color={r.sales >= REPORT_SALES ? '#B26B00' : undefined} />
              <Muted>{`${r.sales} of ${REPORT_SALES} sales · ${formatGBP(r.received, { whole: true })} of about ${formatGBP(REPORT_APPROX_GBP, { whole: true })}`}</Muted>
            </Stack>
          ))}
          {reporting.some((r) => r.reportable) ? (
            <Note>Being reported doesn't mean you owe tax. Selling your own unwanted things usually isn't taxable. It matters if you buy or make things to sell for profit.</Note>
          ) : null}
          <Button small variant="ghost" title="Read HMRC's guidance" onPress={() => WebBrowser.openBrowserAsync('https://www.gov.uk/guidance/check-if-you-need-to-tell-hmrc-about-your-income-from-online-platforms')} />
        </Card>
      </Section>

      <Section title={`Trading allowance, tax year ${ty.label}`}>
        <Card testID="trading">
          <H2>{`${formatGBP(trading, { whole: true })} of ${formatGBP(TRADING_ALLOWANCE, { whole: true })}`}</H2>
          <ProgressBar value={trading / TRADING_ALLOWANCE} label="Trading income towards the £1,000 allowance" />
          <Muted>{"Takings from things you bought or made to sell (your own stuff isn't counted). Above £1,000 in a tax year you may need to register for Self Assessment. The allowance is due to rise to £3,000 from 6 April 2027."}</Muted>
          <Muted>General information, not tax advice. Rules checked 23 Nov 2026.</Muted>
        </Card>
      </Section>

      <Sheet visible={goalSheet} onClose={() => setGoalSheet(false)} title="Monthly profit goal">
        <Stack>
          <MoneyField label="Goal for each month" value={goalInput} onChange={setGoalInput} autoFocus testID="goal-input" />
          <Button title="Save goal" disabled={!goalInput} onPress={() => { setGoal(goalInput); setGoalSheet(false); }} testID="goal-save" />
          {goal ? <Button title="Remove goal" variant="ghost" onPress={() => { setGoal(null); setGoalSheet(false); }} /> : null}
        </Stack>
      </Sheet>
      <ArcadeEntry />
    </Screen>
  );
}
