import { router, Stack as RouterStack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { track } from '@/kit/analytics';
import { useCelebrate } from '@/kit/celebrate';
import { formatDay, todayKey } from '@/kit/dates';
import { useFeedback } from '@/kit/feedback';
import { DateStepper, MoneyField } from '@/kit/inputs';
import { formatGBP, type Pence } from '@/kit/money';
import { Body, Button, Card, Divider, EmptyState, H1, Label, Muted, Note, Row, Screen, Sheet, Stack, Strong } from '@/kit/ui';
import { daysListed, DUSTY_DAYS, feeNote, FEES_CHECKED, platformLabel, profit, saleError, suggestedFee } from '@/domain/resale';
import { useItems } from '@/state/items';

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Body>{label}</Body>
      {strong ? <Strong>{value}</Strong> : <Body>{value}</Body>}
    </Row>
  );
}

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useItems((s) => s.items.find((i) => i.id === id));
  const { toast, confirm } = useFeedback();
  const celebrate = useCelebrate();
  const today = todayKey();
  const [selling, setSelling] = useState(false);
  const [price, setPrice] = useState<Pence | null>(null);
  const [postage, setPostage] = useState<Pence | null>(0);
  const [fees, setFees] = useState<Pence | null>(0);
  const [feesEdited, setFeesEdited] = useState(false);
  const [day, setDay] = useState(today);
  const [err, setErr] = useState<string | null>(null);

  if (!item) return <Screen edges={[]}><EmptyState title="This item isn't here" body="It may have been deleted." action={<Button title="Back to stock" onPress={() => router.replace('/stock')} />} /></Screen>;

  const p = profit(item);
  const d = daysListed(item, today);

  const sell = () => {
    const e = saleError({ price, fees, postage });
    if (e) return setErr(e);
    useItems.getState().sell(item.id, { day, price: price!, fees: fees!, postage: postage! });
    const made = price! - fees! - postage! - item.cost;
    track('core_action_completed', { what: 'sale_logged', platform: item.platform });
    setSelling(false);
    celebrate({ scene: 'sold', emoji: '💸', title: 'Ka-ching!', body: `${item.name} sold. ${made >= 0 ? `${formatGBP(made)} profit.` : `${formatGBP(-made)} under what you paid, but it's gone.`}` });
  };

  return (
    <Screen edges={[]} testID="item">
      <RouterStack.Screen options={{ title: item.name }} />
      <Stack gap={4}>
        <Label>{`${platformLabel(item.platform)} · ${item.forResale ? 'bought to sell' : 'my own stuff'}`}</Label>
        <H1>{item.name}</H1>
        <Muted>{item.sold ? `Sold ${formatDay(item.sold.day)} after ${d} ${d === 1 ? 'day' : 'days'}` : `Listed ${formatDay(item.listedOn)} · ${d} ${d === 1 ? 'day' : 'days'}${d >= DUSTY_DAYS ? ' · getting dusty 🤧' : ''}`}</Muted>
      </Stack>

      {item.sold ? (
        <Card testID="breakdown">
          <Line label="Sold for" value={formatGBP(item.sold.price)} />
          <Line label="Fees" value={`−${formatGBP(item.sold.fees)}`} />
          <Line label="Postage" value={`−${formatGBP(item.sold.postage)}`} />
          <Line label="You paid" value={`−${formatGBP(item.cost)}`} />
          <Divider />
          <Line label="Profit" value={formatGBP(p!, { sign: p! > 0 })} strong />
        </Card>
      ) : (
        <Card>
          <Line label="You paid" value={formatGBP(item.cost)} />
          <Button title="Mark as sold" icon="cash-outline" onPress={() => { setPrice(null); setFees(0); setFeesEdited(false); setPostage(0); setDay(today); setErr(null); setSelling(true); }} testID="item-sell" />
        </Card>
      )}

      {item.sold ? <Button title="Not sold after all" variant="secondary" onPress={() => useItems.getState().unsell(item.id)} testID="item-unsell" /> : null}
      <Button
        title="Delete item"
        variant="danger"
        testID="item-delete"
        onPress={async () => {
          if (!(await confirm({ title: `Delete ${item.name}?`, confirmLabel: 'Delete', destructive: true }))) return;
          const removed = useItems.getState().remove(item.id);
          router.back();
          toast('Item deleted.', { actionLabel: 'Undo', onAction: () => removed && useItems.getState().restore(removed) });
        }}
      />

      <Sheet visible={selling} onClose={() => setSelling(false)} title="Sold! 🎉">
        <Stack>
          <MoneyField
            label="What it sold for"
            value={price}
            autoFocus
            testID="sell-price"
            onChange={(v) => {
              setPrice(v);
              setErr(null);
              if (!feesEdited && v != null) setFees(suggestedFee(item.platform, v));
            }}
          />
          <MoneyField label="Postage you paid" value={postage} onChange={setPostage} hint="0 if the buyer paid it or you used their label." testID="sell-postage" />
          <MoneyField label={`${platformLabel(item.platform)} fees`} value={fees} onChange={(v) => { setFees(v); setFeesEdited(true); }} testID="sell-fees" />
          <Muted>{`${feeNote(item.platform)} Fees last checked ${formatDay(FEES_CHECKED)}.`}</Muted>
          <DateStepper label="Sold on" value={day} onChange={setDay} min={item.listedOn} max={today} testID="sell-day" />
          {price != null && fees != null && postage != null ? (
            <Note>{`Profit: ${formatGBP(price - fees - postage - item.cost)}`}</Note>
          ) : null}
          {err ? <Note tone="warning">{err}</Note> : null}
          <Button title="Log the sale" onPress={sell} testID="sell-save" />
        </Stack>
      </Sheet>
    </Screen>
  );
}

