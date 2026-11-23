import { router } from 'expo-router';
import { useState } from 'react';
import { PaywallSheet } from '@/kit/Paywall';
import { usePremium } from '@/kit/premium';
import { FREE_ITEMS_PER_MONTH } from '@/brand';
import { addedThisMonth, useItems } from '@/state/items';

export function useAddItem() {
  const { isPremium } = usePremium();
  const added = useItems((s) => s.added);
  const [paywall, setPaywall] = useState(false);
  const add = () => (!isPremium && addedThisMonth(added) >= FREE_ITEMS_PER_MONTH ? setPaywall(true) : router.push('/item/new'));
  const sheet = <PaywallSheet visible={paywall} onClose={() => setPaywall(false)} reason={`Free Flipped logs ${FREE_ITEMS_PER_MONTH} items a month. Premium is unlimited.`} />;
  return { add, sheet };
}
