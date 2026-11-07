import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { tapHaptic } from '../feedback';
import { colors, radius, spacing, statColors, statIcons } from '../theme/tokens';
import { StatKey } from '@engine/types';

export function Button(props: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'accent';
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const v = props.variant ?? 'primary';
  const scale = useRef(new Animated.Value(1)).current;
  const pressTo = (to: number) =>
    Animated.spring(scale, { toValue: to, friction: 6, tension: 220, useNativeDriver: true }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, props.style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={props.label}
        accessibilityState={{ disabled: !!props.disabled }}
        disabled={props.disabled}
        onPressIn={() => pressTo(0.96)}
        onPressOut={() => pressTo(1)}
        onPress={() => {
          tapHaptic();
          props.onPress();
        }}
        style={[
          styles.btn,
          props.small && styles.btnSmall,
          v === 'primary' && { backgroundColor: colors.primary },
          v === 'accent' && { backgroundColor: colors.accent },
          v === 'ghost' && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
          props.disabled && { opacity: 0.4 },
        ]}
      >
        <Text style={[styles.btnText, v === 'accent' && { color: colors.bg }]}>{props.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function StatBar({ stat, value }: { stat: StatKey; value: number }) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, { toValue: value, duration: 700, useNativeDriver: false }).start();
  }, [value, w]);
  const width = w.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View
      style={styles.statRow}
      accessible
      accessibilityLabel={`${stat} ${Math.round(value)} out of 100`}
    >
      <Text style={styles.statIcon}>{statIcons[stat]}</Text>
      <View style={{ flex: 1 }}>
        <View style={styles.statHead}>
          <Text style={styles.statName}>{stat[0]?.toUpperCase() + stat.slice(1)}</Text>
          <Text style={styles.statVal}>{Math.round(value)}</Text>
        </View>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width, backgroundColor: statColors[stat] }]} />
        </View>
      </View>
    </View>
  );
}

export function Chip({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'good' | 'bad' }) {
  return (
    <View
      style={[
        styles.chip,
        tone === 'good' && { backgroundColor: '#164A2E' },
        tone === 'bad' && { backgroundColor: '#5A1F27' },
      ]}
    >
      <Text style={[styles.chipText, tone === 'good' && { color: colors.good }, tone === 'bad' && { color: colors.bad }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center' },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.sm },
  btnText: { color: colors.text, fontWeight: '800', fontSize: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  statHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  statName: { color: colors.text, fontWeight: '700' },
  statVal: { color: colors.muted, fontWeight: '700' },
  track: { height: 10, borderRadius: 6, backgroundColor: colors.surface, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 6 },
  chip: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
});
