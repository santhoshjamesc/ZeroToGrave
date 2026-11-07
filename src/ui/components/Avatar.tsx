import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { AvatarSpec } from '@engine/avatar';
import { applyMicro, baseFace, Cue, cueSequence, Face, MicroId, MICROS, microPool, pickMicro, MouthKind } from '@engine/expression';
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
  /** A reaction to play (change `id` to trigger again). */
  cue?: { id: number; kind: Cue } | null;
}

/** Procedural 2D avatar: age, mood, health, clothing from `spec`; taps make it react. */
function AvatarImpl({ spec, size = 220, interactive = true, onTap, bust = false, cue = null }: Props) {
  const [blink, setBlink] = useState(false);
  const [micro, setMicro] = useState<MicroId | null>(null);
  const microTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lead = spec.temperaments[0];
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

  const clearMicro = useCallback(() => {
    microTimers.current.forEach(clearTimeout);
    microTimers.current = [];
  }, []);

  // Idle micro-expressions: a flicker every few seconds, flavoured by personality, mood and age.
  useEffect(() => {
    if (!spec.alive || spec.sickness > 0.85) return;
    const pool = microPool(spec.temperaments, spec.mood, spec.stage);
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        const id = pickMicro(pool, Math.random());
        if (id) {
          setMicro(id);
          microTimers.current.push(setTimeout(() => setMicro(null), MICROS[id].ms));
        }
        schedule();
      }, 2600 + Math.random() * 4200);
    };
    schedule();
    return () => clearTimeout(t);
  }, [spec.alive, spec.sickness, spec.temperaments, spec.mood, spec.stage]);

  // Reactions: a short sequence of micros, played by temperament.
  useEffect(() => {
    if (!cue) return;
    clearMicro();
    let at = 0;
    for (const step of cueSequence(cue.kind, lead)) {
      const def = MICROS[step.micro];
      microTimers.current.push(setTimeout(() => setMicro(step.micro), at));
      at += def.ms;
      microTimers.current.push(setTimeout(() => setMicro(null), at));
      at += step.gap;
    }
  }, [cue?.id]);

  useEffect(() => clearMicro, [clearMicro]);

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

  const face = useMemo(() => {
    const base = baseFace(spec.mood, lead, spec.sickness);
    return micro ? applyMicro(base, micro) : base;
  }, [spec.mood, spec.sickness, lead, micro]);
  const f = spec.features;
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
              {f.pattern === 'stripes' && (
                <G stroke="#FFFFFF" strokeWidth={4} opacity={0.35}>
                  {[160, 174, 188, 202, 216].map((y) => (
                    <Line key={y} x1={66} y1={y} x2={134} y2={y} />
                  ))}
                </G>
              )}
              {f.pattern === 'dots' && (
                <G fill="#FFFFFF" opacity={0.35}>
                  {[[80, 164], [100, 172], [120, 164], [88, 192], [112, 192], [100, 210], [76, 212], [124, 212]].map(([x, y], i) => (
                    <Circle key={i} cx={x} cy={y} r={3.5} />
                  ))}
                </G>
              )}
              {f.pattern === 'collar' && <Path d="M84 136 L100 156 L116 136 L108 134 L100 144 L92 134 Z" fill="#FFFFFF" opacity={0.8} />}
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
                <Ellipse cx={64 - (f.faceW - 1) * 30} cy={98} rx={6 * f.earSize} ry={9 * f.earSize} fill={spec.skinTone} />
                <Ellipse cx={136 + (f.faceW - 1) * 30} cy={98} rx={6 * f.earSize} ry={9 * f.earSize} fill={spec.skinTone} />
                {f.earrings && (
                  <G fill="#F2C14E">
                    <Circle cx={64 - (f.faceW - 1) * 30} cy={108 + 8 * f.earSize} r={2.6} />
                    <Circle cx={136 + (f.faceW - 1) * 30} cy={108 + 8 * f.earSize} r={2.6} />
                  </G>
                )}
                <G transform={`translate(100 95) scale(${f.faceW} 1) translate(-100 -95)`}>
                  {f.jaw === 'square' ? (
                    <Rect x={65} y={57} width={70} height={80} rx={26} fill={spec.skinTone} />
                  ) : (
                    <Ellipse cx={100} cy={f.jaw === 'soft' ? 97 : 95} rx={35} ry={f.jaw === 'soft' ? 40 : 38} fill={spec.skinTone} />
                  )}
                  {spec.sickness > 0.05 && (
                    <Ellipse cx={100} cy={95} rx={35} ry={38} fill="#8DBE7A" opacity={spec.sickness * 0.4} />
                  )}
                </G>
                {spec.beard && (
                  <Path d="M66 100 Q68 146 100 148 Q132 146 134 100 Q122 124 100 124 Q78 124 66 100 Z" fill={hair} />
                )}
                {/* cheeks + freckles */}
                <Circle cx={78} cy={108} r={6 + face.blush * 2} fill="#FF8FA3" opacity={0.1 + face.blush * 0.55} />
                <Circle cx={122} cy={108} r={6 + face.blush * 2} fill="#FF8FA3" opacity={0.1 + face.blush * 0.55} />
                {f.mole && <Circle cx={f.mole.x} cy={f.mole.y} r={1.8} fill="#4A2C1B" opacity={0.7} />}
                {f.dimples && (face.mouth === 'smile' || face.mouth === 'grin') && (
                  <G stroke={skinShade} strokeWidth={1.6} strokeLinecap="round" fill="none">
                    <Path d="M80 116 q-2 3 0 6" />
                    <Path d="M120 116 q2 3 0 6" />
                  </G>
                )}
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
                <FaceView spec={spec} face={face} blink={blink} hair={hair} />
                {f.headwear === 'cap' && (
                  <G>
                    <Path d="M62 80 Q62 44 100 44 Q138 44 138 80 Z" fill="#3B6FB6" />
                    <Path d="M100 76 L152 80 Q150 88 100 84 Z" fill="#2D5896" />
                  </G>
                )}
                {f.headwear === 'beanie' && (
                  <G>
                    <Path d="M62 82 Q60 40 100 40 Q140 40 138 82 Q100 70 62 82 Z" fill="#C0392B" />
                    <Rect x={60} y={76} width={80} height={9} rx={4} fill="#A93226" />
                    <Circle cx={100} cy={38} r={6} fill="#E8E8F0" />
                  </G>
                )}
                {f.headwear === 'headband' && <Path d="M64 74 Q100 60 136 74" stroke="#E56B9B" strokeWidth={6} fill="none" strokeLinecap="round" />}
              </G>
            </G>
          </Svg>
        </Animated.View>
      </Pressable>
    </View>
  );
}

function mouthPath(kind: MouthKind, w: number): { d: string; fill?: string } {
  const hw = 12 * w;
  const l = 100 - hw;
  const r = 100 + hw;
  switch (kind) {
    case 'grin':
      return { d: `M${l - 4} 110 Q100 134 ${r + 4} 110 Z`, fill: '#7A1F2B' };
    case 'smile':
      return { d: `M${l} 113 Q100 125 ${r} 113` };
    case 'flat':
      return { d: `M${l + 2} 117 L${r - 2} 117` };
    case 'frown':
      return { d: `M${l + 1} 120 Q100 110 ${r - 1} 120` };
    case 'smirkL':
      return { d: `M${l} 111 Q${100 - 4} 122 ${r - 4} 117` };
    case 'smirkR':
      return { d: `M${l + 4} 117 Q${100 + 4} 122 ${r} 111` };
    case 'pursed':
      return { d: `M${94} 117 Q100 113 106 117 Q100 121 94 117 Z`, fill: '#7A1F2B' };
    case 'o':
      return { d: 'M95 116 Q100 111 105 116 Q100 124 95 116 Z', fill: '#7A1F2B' };
    case 'wobble':
      return { d: `M${l + 3} 119 Q${92} 113 ${98} 119 Q${106} 113 ${r - 3} 119` };
    case 'bite':
      return { d: `M${l + 4} 116 Q100 120 ${r - 4} 116` };
    case 'tight':
      return { d: `M${l + 4} 118 Q100 115 ${r - 4} 118` };
  }
}

function FaceView({ spec, face, blink, hair }: { spec: AvatarSpec; face: Face; blink: boolean; hair: string }) {
  const f = spec.features;
  const ex = [86 - f.eyeGap, 114 + f.eyeGap] as const;
  const eyeRy = 8 * f.eyeSize * (face.lid < 0 ? 1.12 : 1);
  const eyeRx = 7 * f.eyeSize;
  const lid = Math.max(0, face.lid);
  const closed = blink || !spec.alive;
  const m = mouthPath(face.mouth, f.mouthW);
  return (
    <G>
      {/* brows: tilt raises the inner end (worry) or lowers it (anger) */}
      <Line x1={ex[0] - 10} y1={79 - face.browL.lift + face.browL.tilt * 0.0} x2={ex[0] + 9} y2={79 - face.browL.lift - face.browL.tilt} stroke={hair} strokeWidth={f.browThick} strokeLinecap="round" />
      <Line x1={ex[1] - 9} y1={79 - face.browR.lift - face.browR.tilt} x2={ex[1] + 10} y2={79 - face.browR.lift} stroke={hair} strokeWidth={f.browThick} strokeLinecap="round" />
      {closed ? (
        <G stroke="#2A2230" strokeWidth={2.6} strokeLinecap="round">
          <Line x1={ex[0] - 7} y1={93} x2={ex[0] + 7} y2={93} />
          <Line x1={ex[1] - 7} y1={93} x2={ex[1] + 7} y2={93} />
        </G>
      ) : (
        <G>
          {ex.map((cx, i) => (
            <G key={i}>
              <Ellipse cx={cx} cy={93} rx={eyeRx} ry={eyeRy} fill="#FFFFFF" />
              <Circle cx={cx + face.gazeX * 2.6} cy={94 + face.gazeY * 2.4} r={4.2 * face.pupil * f.eyeSize} fill={spec.eyeColor} />
              <Circle cx={cx + 1.5 + face.gazeX * 2.6} cy={92 + face.gazeY * 2.4} r={1.4} fill="#FFFFFF" />
              {lid > 0.02 && (
                <Rect x={cx - eyeRx - 1} y={93 - eyeRy - 1} width={eyeRx * 2 + 2} height={(eyeRy * 2 + 1) * lid} fill={spec.skinTone} />
              )}
            </G>
          ))}
        </G>
      )}
      {(face.tear || spec.mood === 'miserable') && <Path d={`M${ex[0] - 6} 102 q-3 7 0 10 q3 -3 0 -10 Z`} fill="#7CC4FF" />}
      {(face.sweat || spec.sickness > 0.6) && <Path d="M132 70 q-4 8 0 11 q4 -3 0 -11 Z" fill="#7CC4FF" />}
      {/* nose */}
      {f.nose === 'button' && <Path d="M97 101 Q100 106 103 101" stroke="#00000030" strokeWidth={2} fill="none" strokeLinecap="round" />}
      {f.nose === 'long' && <Path d="M99 94 Q96 106 101 108 M99 94 L99 104" stroke="#00000030" strokeWidth={2} fill="none" strokeLinecap="round" />}
      {f.nose === 'wide' && <Path d="M93 104 Q100 110 107 104 M95 100 Q100 104 105 100" stroke="#00000030" strokeWidth={2} fill="none" strokeLinecap="round" />}
      {/* mouth */}
      {spec.accessory === 'pacifier' ? (
        <G>
          <Circle cx={100} cy={118} r={7} fill="#F28CB1" />
          <Circle cx={100} cy={118} r={3} fill="#FFE0EC" />
        </G>
      ) : (
        <Path d={m.d} stroke="#7A1F2B" strokeWidth={f.lipThick} fill={m.fill ?? 'none'} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {spec.glasses && (
        <G stroke="#2A2230" strokeWidth={2.4} fill="#FFFFFF22">
          <Circle cx={ex[0]} cy={93} r={12} />
          <Circle cx={ex[1]} cy={93} r={12} />
          <Line x1={ex[0] + 12} y1={93} x2={ex[1] - 12} y2={93} />
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
