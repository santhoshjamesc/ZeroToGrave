import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { identityPools } from '@content/index';
import { avatarSpec, lifeStage, newRandomGame } from '@engine/index';
import { SlotInfo } from '../../store/saves';
import { startMusic } from '../audio';
import { Avatar } from '../components/Avatar';
import { Scene } from '../components/Scene';
import { Button } from '../components/kit';
import { colors, spacing } from '../theme/tokens';

const PARADE_AGES = [0, 3, 8, 15, 28, 48, 72, 90];
const STARS = [
  [8, 14],
  [22, 6],
  [37, 22],
  [52, 10],
  [66, 26],
  [80, 8],
  [91, 20],
  [14, 34],
  [74, 40],
] as const;

interface Props {
  latest: SlotInfo | null;
  hasSaves: boolean;
  onContinue: () => void;
  onNewLife: () => void;
  onLoad: () => void;
  onAchievements: () => void;
  onGraveyard: () => void;
  onSettings: () => void;
}

/** Title screen: scenery that ages with a demo character, a pulsing logo, and the main menu. */
export default function StartScreen(p: Props) {
  const demo = useMemo(
    () => newRandomGame(Math.floor(Math.random() * 2147483646) + 1, identityPools, 2026).character,
    [],
  );
  const [step, setStep] = useState(0);
  const age = PARADE_AGES[step % PARADE_AGES.length] ?? 0;
  const spec = useMemo(() => avatarSpec({ ...demo, age }), [demo, age]);

  const pulse = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bob, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(twinkle, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(twinkle, { toValue: 0.2, duration: 900, useNativeDriver: true }),
        ]),
      ),
    ];
    loops.forEach((l) => l.start());
    Animated.timing(enter, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    const t = setInterval(() => setStep((s) => s + 1), 2300);
    return () => {
      loops.forEach((l) => l.stop());
      clearInterval(t);
    };
  }, [pulse, bob, twinkle, enter]);

  useEffect(() => {
    pop.setValue(0.6);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
  }, [step, pop]);

  const go = (fn: () => void) => () => {
    startMusic();
    fn();
  };

  const logoScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const enterY = enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <ScrollView contentContainerStyle={styles.wrap} bounces={false} testID="start-screen">
      <View style={styles.hero}>
        <Scene stage={lifeStage(age)} height={440} />
        {STARS.map(([x, y], i) => (
          <Animated.Text
            key={i}
            style={[
              styles.star,
              { left: `${x}%`, top: y * 3, opacity: twinkle, fontSize: 8 + (i % 3) * 4 },
            ]}
          >
            ✦
          </Animated.Text>
        ))}
        <Animated.View
          style={[styles.logoWrap, { opacity: enter, transform: [{ scale: logoScale }] }]}
        >
          <Text style={styles.logoTop}>ZERO</Text>
          <Text style={styles.logoTo}>— to —</Text>
          <Text style={styles.logoBottom}>GRAVE</Text>
        </Animated.View>
        <Animated.View
          style={[styles.avatarWrap, { transform: [{ translateY: bobY }, { scale: pop }] }]}
        >
          <Avatar spec={spec} size={200} interactive={false} />
        </Animated.View>
        <View style={styles.ageBadge}>
          <Text style={styles.ageNum}>{age}</Text>
          <Text style={styles.ageLbl}>YEARS</Text>
        </View>
      </View>

      <Animated.View style={[styles.menu, { opacity: enter, transform: [{ translateY: enterY }] }]}>
        <Text style={styles.tag}>Every year is a choice. Make them count.</Text>
        {p.latest ? (
          <Button
            variant="accent"
            label={`▶ Continue · ${p.latest.flag} ${p.latest.name}, ${p.latest.age}`}
            onPress={go(p.onContinue)}
          />
        ) : null}
        <Button
          variant={p.latest ? 'primary' : 'accent'}
          label="🎲 New Life"
          onPress={go(p.onNewLife)}
        />
        {p.hasSaves ? <Button variant="ghost" label="📂 Load Game" onPress={go(p.onLoad)} /> : null}
        <View style={styles.row}>
          <Button
            style={styles.half}
            variant="ghost"
            label="🏆 Badges"
            onPress={go(p.onAchievements)}
          />
          <Button
            style={styles.half}
            variant="ghost"
            label="🪦 Graveyard"
            onPress={go(p.onGraveyard)}
          />
        </View>
        <Button variant="ghost" label="⚙️ Settings" onPress={go(p.onSettings)} />
        <Text style={styles.foot}>Offline · No ads · No accounts</Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: spacing.xl, backgroundColor: colors.bg },
  hero: { height: 440, alignItems: 'center', overflow: 'hidden' },
  star: { position: 'absolute', color: '#FFFFFF' },
  logoWrap: { marginTop: 54, alignItems: 'center' },
  logoTop: {
    color: '#fff',
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: 10,
    textShadowColor: '#0009',
    textShadowRadius: 10,
  },
  logoTo: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 4,
    textShadowColor: '#0009',
    textShadowRadius: 6,
  },
  logoBottom: {
    color: '#fff',
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: 10,
    textShadowColor: '#0009',
    textShadowRadius: 10,
  },
  avatarWrap: { position: 'absolute', bottom: 6 },
  ageBadge: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    backgroundColor: colors.bg,
    borderColor: colors.accent,
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
  },
  ageNum: { color: colors.accent, fontSize: 28, fontWeight: '900', lineHeight: 30 },
  ageLbl: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  menu: { padding: spacing.md, gap: spacing.sm, marginTop: spacing.sm },
  tag: { color: colors.muted, textAlign: 'center', fontWeight: '700', marginBottom: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
  foot: { color: colors.muted, textAlign: 'center', fontSize: 12, marginTop: spacing.sm },
});
