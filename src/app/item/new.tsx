import { router } from 'expo-router';
import { useState } from 'react';
import { track } from '@/kit/analytics';
import { addDays, todayKey } from '@/kit/dates';
import { DateStepper, MoneyField } from '@/kit/inputs';
import type { Pence } from '@/kit/money';
import { Button, Chip, Field, Muted, Note, Row, Screen, Section, Segmented } from '@/kit/ui';
import { itemError, PLATFORMS, type Platform } from '@/domain/resale';
import { useItems } from '@/state/items';

export default function NewItem() {
  const today = todayKey();
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<Platform>('vinted');
  const [cost, setCost] = useState<Pence | null>(null);
  const [listedOn, setListedOn] = useState(today);
  const [forResale, setForResale] = useState<'resale' | 'own'>('resale');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const err = itemError({ name, cost });
    if (err) return setError(err);
    const id = useItems.getState().add({ name: name.trim(), platform, cost: cost!, listedOn, forResale: forResale === 'resale' });
    track('core_action_completed', { what: 'item_added', platform });
    router.replace(`/item/${id}`);
  };

  return (
    <Screen edges={['bottom']} testID="item-new" footer={<Button title="Add to stock" onPress={save} testID="item-save" />}>
      <Field label="What is it?" value={name} onChangeText={(t) => { setName(t); setError(null); }} placeholder="e.g. Levi's 501 jeans" maxLength={60} testID="item-name" />
      <Section title="Where is it listed?">
        <Row wrap gap={8}>
          {PLATFORMS.map((p) => (
            <Chip key={p.value} label={p.label} selected={platform === p.value} onPress={() => setPlatform(p.value)} testID={`platform-${p.value}`} />
          ))}
        </Row>
      </Section>
      <MoneyField label="What you paid for it" value={cost} onChange={(v) => { setCost(v); setError(null); }} hint="0 if it was free or a gift." testID="item-cost" />
      <DateStepper label="Listed on" value={listedOn} onChange={setListedOn} min={addDays(today, -365)} max={today} testID="item-listed" />
      <Segmented label="Is it" options={[{ value: 'resale', label: 'Bought to sell' }, { value: 'own', label: 'My own stuff' }]} value={forResale} onChange={setForResale} testID="item-kind" />
      <Muted>Selling your own unwanted things usually isn't taxable. Things bought or made to sell can count as trading.</Muted>
      {error ? <Note tone="warning">{error}</Note> : null}
    </Screen>
  );
}
