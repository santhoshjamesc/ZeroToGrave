import { ReactNode, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { GameAction, GameState } from '@engine/index';
import { colors, radius, spacing } from '../theme/tokens';

export interface TabProps {
  game: GameState;
  act: (a: GameAction) => void;
  guarded: boolean;
}

export const fmt = (n: number): string => `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;

export function FadeIn({ children }: { children: ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

export function SectionHeader({ icon, title, color = colors.accent }: { icon: string; title: string; color?: string }) {
  return (
    <View style={[styles.header, { borderLeftColor: color }]} accessibilityRole="header">
      <Text style={styles.headerIcon}>{icon}</Text>
      <Text style={[styles.headerText, { color }]}>{title}</Text>
    </View>
  );
}

export function Banner({ text, tone = 'info' }: { text: string; tone?: 'info' | 'warn' | 'bad' }) {
  const bg = tone === 'bad' ? '#5A1F27' : tone === 'warn' ? '#5A4A1A' : colors.surface;
  const fg = tone === 'bad' ? colors.bad : tone === 'warn' ? colors.accent : colors.muted;
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Text style={[styles.bannerText, { color: fg }]}>{text}</Text>
    </View>
  );
}

export function Meter({ value, color, label }: { value: number; color: string; label: string }) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, { toValue: value, duration: 600, useNativeDriver: false }).start();
  }, [value, w]);
  return (
    <View accessible accessibilityLabel={`${label} ${Math.round(value)} out of 100`}>
      <View style={styles.meterHead}>
        <Text style={styles.meterLabel}>{label}</Text>
        <Text style={styles.meterLabel}>{Math.round(value)}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: color, width: w.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
      </View>
    </View>
  );
}

export const pageStyle = { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 } as const;

export const common = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  icon: { fontSize: 28, width: 40, textAlign: 'center' },
  name: { color: colors.text, fontSize: 16, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  reason: { color: colors.bad, fontSize: 12, fontWeight: '700' },
  big: { color: colors.text, fontSize: 24, fontWeight: '900' },
  pill: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  pillOn: { backgroundColor: colors.primary },
  pillText: { color: colors.muted, fontWeight: '800', fontSize: 13 },
  pillTextOn: { color: colors.text },
});

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderLeftWidth: 4, paddingLeft: spacing.sm, marginTop: spacing.sm },
  headerIcon: { fontSize: 20 },
  headerText: { fontSize: 15, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  banner: { borderRadius: radius.md, padding: spacing.md },
  bannerText: { fontWeight: '700', lineHeight: 20 },
  meterHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  meterLabel: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surface, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
});
