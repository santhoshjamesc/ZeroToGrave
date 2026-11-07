import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

export interface ToastMsg {
  id: number;
  icon: string;
  text: string;
  tone: 'info' | 'bad' | 'win';
}

/** One message at a time, slides in from the top and fades. Never blocks input. */
export function Toast({ msg }: { msg: ToastMsg | null }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!msg) return;
    y.setValue(0);
    Animated.sequence([
      Animated.timing(y, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(2600),
      Animated.timing(y, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [msg, y]);
  if (!msg) return null;
  const translateY = y.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] });
  const border = msg.tone === 'bad' ? colors.bad : msg.tone === 'win' ? colors.accent : colors.primary;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.wrap, { opacity: y, borderColor: border, transform: [{ translateY }] }]}
    >
      <Text style={styles.icon}>{msg.icon}</Text>
      <Text style={styles.text}>{msg.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 56,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    zIndex: 50,
    elevation: 12,
  },
  icon: { fontSize: 24 },
  text: { color: colors.text, flex: 1, fontWeight: '700', fontSize: 14, lineHeight: 19 },
});
