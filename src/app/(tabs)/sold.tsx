import { router } from 'expo-router';
import { formatDay } from '@/kit/dates';
import { formatGBP } from '@/kit/money';
import { Card, EmptyState, H1, Muted, Row, Screen, Section, Stack, Strong } from '@/kit/ui';
import { monthSummary, platformLabel, profit } from '@/domain/resale';
import { useItems } from '@/state/items';

export default function Sold() {
  const items = useItems((s) => s.items);
  const sold = items.filter((i) => i.sold).sort((a, b) => (a.sold!.day < b.sold!.day ? 1 : -1));
  const months = [...new Set(sold.map((i) => i.sold!.day.slice(0, 7)))];
  return (
    <Screen testID="sold">
      <H1>Sold</H1>
      {sold.length === 0 ? <EmptyState icon="pricetag-outline" title="No sales yet" body="When something sells, open it in Stock and tap 'Mark as sold'." /> : null}
      {months.map((m) => {
        const s = monthSummary(items, m);
        return (
          <Section key={m} title={formatDay(`${m}-01`, 'month')} right={<Muted>{`${formatGBP(s.profit, { sign: s.profit > 0 })} profit`}</Muted>}>
            <Stack gap={8}>
              {sold
                .filter((i) => i.sold!.day.startsWith(m))
                .map((i) => {
                  const p = profit(i)!;
                  return (
                    <Card key={i.id} onPress={() => router.push(`/item/${i.id}`)} testID={`sold-${i.name}`} accessibilityLabel={`${i.name}, sold for ${formatGBP(i.sold!.price)}, profit ${formatGBP(p)}`}>
                      <Row style={{ justifyContent: 'space-between' }}>
                        <Stack gap={2} style={{ flex: 1 }}>
                          <Strong>{i.name}</Strong>
                          <Muted>{`${platformLabel(i.platform)} · ${formatDay(i.sold!.day)} · sold ${formatGBP(i.sold!.price)}`}</Muted>
                        </Stack>
                        <Strong color={p < 0 ? '#B3261E' : undefined}>{formatGBP(p, { sign: p > 0 })}</Strong>
                      </Row>
                    </Card>
                  );
                })}
            </Stack>
          </Section>
        );
      })}
    </Screen>
  );
}
