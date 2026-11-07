import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { AvatarSpec } from '@engine/avatar';
import { boopHaptic, tapHaptic } from '../feedback';
import { colors } from '../theme/tokens';

type Region = 'head' | 'body' | 'legs';

const LINES: Record<Region, Record<AvatarSpec['mood'], string[]>> = {
  head: {
    ecstatic: ['Hehe! 😄', 'Best day ever!', 'Boop! 🥰'],
    happy: ['Hey there!', 'Hehe, that tickles', 'Boop!'],
    neutral: ['Hm?', 'Yes?', 'Ow, my head.'],
    sad: ['Please, not now…', 'Ow.', '*sniff*'],
    miserable: ['Leave me alone…', '😢', 'Everything hurts.'],
  },
  body: {
    ecstatic: ['Woohoo! 🎉', 'Hug time!', 'Dance with me!'],
    happy: ['Hehe!', 'Oof! Nice.', 'Feeling good!'],
    neutral: ['Hey!', 'Oh. Hi.', 'What?'],
    sad: ['Not in the mood.', 'Ugh.', 'Go away.'],
    miserable: ['Just let me be.', '…', 'Why bother?'],
  },
  legs: {
    ecstatic: ['*skips around* 💃', 'Wheee!', 'Tap dance!'],
    happy: ['Hop hop!', 'Ha! Stop!', 'My toes!'],
    neutral: ['Watch the shoes.', 'Hey!', 'Walking…'],
    sad: ['My feet…', 'Ow.', 'Sigh.'],
    miserable: ['*trips* 😵', 'Ouch…', 'Why?'],
  },
};
const SICK_LINES = ['*cough* 🤒', 'I do not feel so good…', 'Need a doctor.'];
const BABY_LINES = ['Goo goo!', 'Baaah! 👶', 'Gah!', '*giggles*'];

function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const m = pa.map((v, i) => Math.round(v + ((pb[i] ?? 0) - v) * t));
  return `#${m.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

interface Props {
  spec: AvatarSpec;
  /** Rendered width in px. Height is 1.5x. */
  size?: number;
  interactive?: boolean;
  /** Called after a tap, e.g. to track "poked" counters. */
  onTap?: (region: Region) => void;
  /** Show only head and shoulders (for lists). */
  bust?: boolean;
}

/** Procedural 2D avatar: age, mood, health, clothing from `spec`; taps make it react. */
function AvatarImpl({ spec, size = 220, interactive = true, onTap, bust = false }: Props) {
  const [blink, setBlink] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const bob = useRef(new Animated.Value(0)).current;
  const squish = useRef(new Animated.Value(1)).current;
  const wiggle = useRef(new Animated.Value(0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
  }, []);

  // Idle breathing.
  useEffect(() => {
    if (reduceMotion || !interactive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -4, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob, reduceMotion, interactive]);

  // Random blinking.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          schedule();
        }, 140);
      }, 2200 + Math.random() * 2600);
    };
    schedule();
    return () => clearTimeout(t);
  }, []);

  useEffect(
    () => () => {
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    },
    [],
  );

  const react = useCallback(
    (region: Region) => {
      const pool =
        spec.stage === 'baby' || spec.stage === 'toddler'
          ? BABY_LINES
          : spec.sickness > 0.6 && region !== 'legs'
            ? SICK_LINES
            : LINES[region][spec.mood];
      setBubble(pool[Math.floor(Math.random() * pool.length)] ?? '…');
      if (region === 'head') tapHaptic();
      else boopHaptic();

      bubbleOpacity.setValue(1);
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(
        () => Animated.timing(bubbleOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(),
        1600,
      );

      if (reduceMotion) return;
      squish.setValue(region === 'legs' ? 1.08 : 0.9);
      wiggle.setValue(region === 'head' ? 1 : 0);
      Animated.parallel([
        Animated.spring(squish, { toValue: 1, friction: 3, tension: 160, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 0, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    },
    [spec.stage, spec.sickness, spec.mood, bubbleOpacity, squish, wiggle, reduceMotion],
  );

  const height = size * 1.5;
  const onPress = (e: { nativeEvent: { locationY: number } }) => {
    const f = e.nativeEvent.locationY / height;
    const region: Region = f < 0.5 ? 'head' : f < 0.76 ? 'body' : 'legs';
    react(region);
    onTap?.(region);
  };

  const hair = useMemo(() => mix(spec.hairColor, '#C9CCD6', spec.grey), [spec.hairColor, spec.grey]);
  const skinShade = useMemo(() => mix(spec.skinTone, '#000000', 0.12), [spec.skinTone]);
  const rotate = wiggle.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '6deg'] });

  const viewBox = bust ? '30 20 140 150' : '0 0 200 300';
  const boxH = bust ? size * (150 / 140) : height;

  return (
    <View style={{ width: size, height: boxH }}>
      {bubble && (
        <Animated.View style={[styles.bubble, { opacity: bubbleOpacity }]} pointerEvents="none">
          <Text style={styles.bubbleText}>{bubble}</Text>
          <View style={styles.bubbleTail} />
        </Animated.View>
      )}
      <Pressable
        disabled={!interactive}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Your character. Tap to interact."
        style={{ width: size, height: boxH }}
      >
        <Animated.View
          style={{ transform: [{ translateY: bob }, { scale: squish }, { rotate }] }}
        >
          <Svg width={size} height={boxH} viewBox={viewBox}>
            <Ellipse cx={100} cy={282} rx={52 * spec.bodyScale + 8} ry={8} fill="#000" opacity={0.22} />
            <G transform={`translate(100 280) scale(${spec.bodyScale}) translate(-100 -280)`}>
              {/* backpack (behind) */}
              {spec.accessory === 'backpack' && (
                <Rect x={126} y={146} width={28} height={58} rx={12} fill="#E5675F" />
              )}
              {/* legs + shoes */}
              <Rect x={72} y={214} width={25} height={58} rx={9} fill={spec.pants} />
              <Rect x={103} y={214} width={25} height={58} rx={9} fill={spec.pants} />
              <Ellipse cx={82} cy={277} rx={17} ry={8} fill="#1E1E28" />
              <Ellipse cx={118} cy={277} rx={17} ry={8} fill="#1E1E28" />
              {/* torso */}
              <Path d="M66 144 Q100 128 134 144 L138 222 Q100 230 62 222 Z" fill={spec.shirt} />
              {spec.accessory === 'tie' && <Path d="M100 140 L93 152 L100 196 L107 152 Z" fill="#C0392B" />}
              {/* arms */}
              <Path d="M68 148 Q50 178 56 206" stroke={spec.shirt} strokeWidth={17} strokeLinecap="round" fill="none" />
              <Path d="M132 148 Q150 178 144 206" stroke={spec.shirt} strokeWidth={17} strokeLinecap="round" fill="none" />
              <Circle cx={56} cy={210} r={9} fill={spec.skinTone} />
              <Circle cx={144} cy={210} r={9} fill={spec.skinTone} />
              {spec.accessory === 'cane' && (
                <G>
                  <Line x1={146} y1={206} x2={146} y2={280} stroke="#8B5E3C" strokeWidth={5} strokeLinecap="round" />
                  <Path d="M146 206 q0 -12 -11 -12" stroke="#8B5E3C" strokeWidth={5} strokeLinecap="round" fill="none" />
                </G>
              )}
              {/* neck */}
              <Rect x={90} y={126} width={20} height={20} fill={skinShade} />

              {/* head group scales from the neck so babies get big heads */}
              <G transform={`translate(100 140) scale(${spec.headScale}) translate(-100 -140)`}>
                {(spec.hairStyle === 'long') && (
                  <Path d="M62 92 Q56 46 100 46 Q144 46 138 92 L144 160 Q100 172 56 160 Z" fill={hair} />
                )}
                <Ellipse cx={64} cy={98} rx={6} ry={9} fill={spec.skinTone} />
                <Ellipse cx={136} cy={98} rx={6} ry={9} fill={spec.skinTone} />
                <Ellipse cx={100} cy={95} rx={35} ry={38} fill={spec.skinTone} />
                {spec.sickness > 0.05 && (
                  <Ellipse cx={100} cy={95} rx={35} ry={38} fill="#8DBE7A" opacity={spec.sickness * 0.4} />
                )}
                {spec.beard && (
                  <Path d="M66 100 Q68 146 100 148 Q132 146 134 100 Q122 124 100 124 Q78 124 66 100 Z" fill={hair} />
                )}
                {/* cheeks + freckles */}
                <Circle cx={78} cy={108} r={6} fill="#FF8FA3" opacity={spec.mood === 'ecstatic' || spec.mood === 'happy' ? 0.35 : 0.12} />
                <Circle cx={122} cy={108} r={6} fill="#FF8FA3" opacity={spec.mood === 'ecstatic' || spec.mood === 'happy' ? 0.35 : 0.12} />
                {spec.freckles && (
                  <G fill={skinShade}>
                    {[[82, 104], [88, 108], [78, 110], [112, 104], [118, 108], [122, 110]].map(([x, y], i) => (
                      <Circle key={i} cx={x} cy={y} r={1.6} />
                    ))}
                  </G>
                )}
                {/* wrinkles */}
                {spec.wrinkles >= 1 && (
                  <Path d="M80 68 Q100 63 120 68" stroke={skinShade} strokeWidth={1.6} fill="none" strokeLinecap="round" />
                )}
                {spec.wrinkles >= 2 && (
                  <G stroke={skinShade} strokeWidth={1.4} strokeLinecap="round">
                    <Line x1={72} y1={92} x2={78} y2={94} />
                    <Line x1={128} y1={92} x2={122} y2={94} />
                  </G>
                )}
                {spec.wrinkles >= 3 && (
                  <G stroke={skinShade} strokeWidth={1.4} fill="none" strokeLinecap="round">
                    <Path d="M86 104 Q82 114 86 122" />
                    <Path d="M114 104 Q118 114 114 122" />
                  </G>
                )}
                {/* hair (front) */}
                {spec.hairStyle === 'short' && (
                  <Path d="M64 94 Q60 48 100 48 Q140 48 136 94 Q124 70 100 70 Q76 70 64 94 Z" fill={hair} />
                )}
                {spec.hairStyle === 'buzz' && (
                  <Path d="M67 88 Q68 56 100 56 Q132 56 133 88 Q120 70 100 70 Q80 70 67 88 Z" fill={hair} opacity={0.85} />
                )}
                {spec.hairStyle === 'long' && (
                  <Path d="M64 96 Q60 50 100 48 Q140 50 136 96 Q128 66 100 66 Q72 66 64 96 Z" fill={hair} />
                )}
                {spec.hairStyle === 'bun' && (
                  <G fill={hair}>
                    <Circle cx={100} cy={46} r={14} />
                    <Path d="M64 94 Q60 52 100 52 Q140 52 136 94 Q124 72 100 72 Q76 72 64 94 Z" />
                  </G>
                )}
                {spec.hairStyle === 'curly' && (
                  <G fill={hair}>
                    {[[70, 70, 14], [86, 57, 15], [106, 54, 16], [124, 61, 15], [134, 78, 12], [64, 88, 11]].map(([x, y, r], i) => (
                      <Circle key={i} cx={x} cy={y} r={r} />
                    ))}
                  </G>
                )}
                {spec.hairStyle === 'bald' && spec.grey > 0.3 && (
                  <G fill={hair}>
                    <Ellipse cx={66} cy={92} rx={4} ry={10} />
                    <Ellipse cx={134} cy={92} rx={4} ry={10} />
                  </G>
                )}
                {/* brows */}
                <Face spec={spec} blink={blink} hair={hair} />
              </G>
            </G>
          </Svg>
        </Animated.View>
      </Pressable>
    </View>
  );
}

function Face({ spec, blink, hair }: { spec: AvatarSpec; blink: boolean; hair: string }) {
  const sad = spec.mood === 'sad' || spec.mood === 'miserable';
  const browTilt = sad ? 4 : spec.mood === 'ecstatic' ? -3 : 0;
  return (
    <G>
      <Line x1={76} y1={79 + browTilt} x2={95} y2={79 - browTilt} stroke={hair} strokeWidth={3.2} strokeLinecap="round" />
      <Line x1={105} y1={79 - browTilt} x2={124} y2={79 + browTilt} stroke={hair} strokeWidth={3.2} strokeLinecap="round" />
      {blink || !spec.alive ? (
        <G stroke="#2A2230" strokeWidth={2.6} strokeLinecap="round">
          <Line x1={79} y1={93} x2={93} y2={93} />
          <Line x1={107} y1={93} x2={121} y2={93} />
        </G>
      ) : (
        <G>
          <Ellipse cx={86} cy={93} rx={7} ry={8} fill="#FFFFFF" />
          <Ellipse cx={114} cy={93} rx={7} ry={8} fill="#FFFFFF" />
          <Circle cx={86} cy={94} r={4.2} fill={spec.eyeColor} />
          <Circle cx={114} cy={94} r={4.2} fill={spec.eyeColor} />
          <Circle cx={87.5} cy={92} r={1.4} fill="#FFFFFF" />
          <Circle cx={115.5} cy={92} r={1.4} fill="#FFFFFF" />
        </G>
      )}
      {spec.mood === 'miserable' && <Path d="M80 102 q-3 7 0 10 q3 -3 0 -10 Z" fill="#7CC4FF" />}
      {spec.sickness > 0.6 && <Path d="M132 70 q-4 8 0 11 q4 -3 0 -11 Z" fill="#7CC4FF" />}
      {/* nose */}
      <Path d="M97 100 Q100 108 103 100" stroke="#00000030" strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* mouth */}
      {spec.accessory === 'pacifier' ? (
        <G>
          <Circle cx={100} cy={118} r={7} fill="#F28CB1" />
          <Circle cx={100} cy={118} r={3} fill="#FFE0EC" />
        </G>
      ) : spec.mood === 'ecstatic' ? (
        <Path d="M84 110 Q100 134 116 110 Z" fill="#7A1F2B" stroke="#7A1F2B" strokeWidth={2} strokeLinejoin="round" />
      ) : spec.mood === 'happy' ? (
        <Path d="M88 113 Q100 124 112 113" stroke="#7A1F2B" strokeWidth={3} fill="none" strokeLinecap="round" />
      ) : spec.mood === 'neutral' ? (
        <Line x1={91} y1={117} x2={109} y2={117} stroke="#7A1F2B" strokeWidth={3} strokeLinecap="round" />
      ) : (
        <Path d="M89 120 Q100 110 111 120" stroke="#7A1F2B" strokeWidth={3} fill="none" strokeLinecap="round" />
      )}
      {spec.glasses && (
        <G stroke="#2A2230" strokeWidth={2.4} fill="#FFFFFF22">
          <Circle cx={86} cy={93} r={12} />
          <Circle cx={114} cy={93} r={12} />
          <Line x1={98} y1={93} x2={102} y2={93} />
        </G>
      )}
    </G>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
    zIndex: 5,
    backgroundColor: colors.text,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: 220,
  },
  bubbleText: { color: colors.bg, fontWeight: '700', fontSize: 14, textAlign: 'center' },
  bubbleTail: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 12,
    height: 12,
    backgroundColor: colors.text,
    transform: [{ rotate: '45deg' }],
  },
});

export const Avatar = memo(AvatarImpl);
