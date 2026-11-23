import { exportFile } from '@/kit/data';
import { track } from '@/kit/analytics';
import { useFeedback } from '@/kit/feedback';
import { usePremium } from '@/kit/premium';
import { KitSettings } from '@/kit/Settings';
import { Card, ListRow, Section } from '@/kit/ui';
import { toCSV } from '@/domain/resale';
import { useItems } from '@/state/items';

export default function Settings() {
  const items = useItems((s) => s.items);
  const { isPremium } = usePremium();
  const { toast } = useFeedback();
  return (
    <KitSettings reminder={{ title: 'Flipped', body: 'Sold anything today? Log it while you remember the postage.', explain: 'One evening nudge to log sales. Never more than once a day.' }}>
      <Section title="Records">
        <Card>
          <ListRow
            icon="document-outline"
            title="Export sales as CSV"
            subtitle={isPremium ? `${items.length} items, ready for a spreadsheet` : 'Premium: for your records or accountant'}
            testID="export-csv"
            onPress={async () => {
              if (!isPremium) return toast('CSV export is part of Premium. Your JSON export below is always free.');
              const r = await exportFile(`flipped-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(items), 'text/csv');
              if (r.ok) track('data_exported', { format: 'csv' });
              else toast(r.message);
            }}
          />
        </Card>
      </Section>
    </KitSettings>
  );
}
