import { SpaceGrotesk_700Bold, useFonts } from '@expo-google-fonts/space-grotesk';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Intro } from '@/kit/Intro';
import { prefsStore } from '@/kit/prefs';
import { KitRoot } from '@/kit/Root';
import { useTheme } from '@/kit/theme';
import { brand } from '@/brand';

SplashScreen.preventAutoHideAsync().catch(() => {});
const usePrefs = prefsStore('flipped', 19);

function Art({ children }: { children: string }) {
  return <Text style={{ fontSize: 96 }}>{children}</Text>;
}

function Shell() {
  const { c } = useTheme();
  const onboarded = usePrefs((s) => s.onboarded);
  const header = { headerShown: true, headerTintColor: c.text, headerStyle: { backgroundColor: c.bg }, headerShadowVisible: false } as const;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="item/new" options={{ ...header, title: 'Add an item', presentation: 'modal' }} />
        <Stack.Screen name="item/[id]" options={{ ...header, title: '' }} />
      </Stack>
      {!onboarded ? (
        <View style={StyleSheet.absoluteFill}>
          <Intro
            cta="Add my first item"
            onDone={() => usePrefs.getState().setOnboarded()}
            steps={[
              { title: 'Real profit', body: "Log what you paid, the fees and the postage. Flipped shows what you actually made on every Vinted, eBay or Depop sale.", art: <Art>💸</Art> },
              { title: 'Spot the dusty stuff', body: "See what's still unsold and how long it's been listed, so you know what to reprice.", art: <Art>📦</Art> },
              { title: 'No HMRC surprises', body: 'Platforms report sellers to HMRC after 30 sales or about £1,700 a year. Flipped shows how close you are on each one.', art: <Art>🧾</Art> },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ SpaceGrotesk_700Bold });
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <KitRoot brand={brand}>
      <Shell />
    </KitRoot>
  );
}
