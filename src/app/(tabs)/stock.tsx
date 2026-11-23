import { router } from 'expo-router';
import { todayKey } from '@/kit/dates';
import { formatGBP } from '@/kit/money';
import { Button, Card, EmptyState, H1, Muted, Row, Screen, Stack, Strong } from '@/kit/ui';
import { daysListed, DUSTY_DAYS, platformLabel } from '@/domain/resale';
import { useAddItem } from '@/components/useAddItem';
import { useItems } from '@/state/items';

export default function Stock() {
  const items = useItems((s) => s.items);
  const today = todayKey();
  const { add, sheet } = useAddItem();
  const unsold = items.filter((i) => !i.sold).sort((a, b) => daysListed(b, today) - daysListed(a, today));
  const tiedUp = unsold.reduce((s, i) => s + i.cost, 0);
  return (
    <Screen testID="stock">
      <H1>Stock</H1>
      {unsold.length ? <Muted testID="stock-summary">{`${unsold.length} unsold · ${formatGBP(tiedUp, { whole: true })} tied up`}</Muted> : null}
      <Button title="Add an item" icon="add" onPress={add} testID="stock-add" />
      {unsold.length === 0 ? <EmptyState icon="cube-outline" title="Nothing waiting to sell" body="Add what you've listed and Flipped keeps count of how long it's been up." /> : null}
      <Stack gap={8}>
        {unsold.map((i) => {
          const d = daysListed(i, today);
          const dusty = d >= DUSTY_DAYS;
          return (
            <Card key={i.id} onPress={() => router.push(`/item/${i.id}`)} testID={`stock-${i.name}`} accessibilityLabel={`${i.name}, ${platformLabel(i.platform)}, listed ${d} days${dusty ? ', getting dusty' : ''}`}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Stack gap={2} style={{ flex: 1 }}>
                  <Strong>{`${dusty ? '🤧 ' : ''}${i.name}`}</Strong>
                  <Muted>{`${platformLabel(i.platform)} · paid ${formatGBP(i.cost)}`}</Muted>
                </Stack>
                <Muted>{d === 0 ? 'listed today' : `${d} ${d === 1 ? 'day' : 'days'}`}</Muted>
              </Row>
              {dusty ? <Muted>Listed for 2+ months. A price drop or new photos might shift it.</Muted> : null}
            </Card>
          );
        })}
      </Stack>
      {sheet}
    </Screen>
  );
}
