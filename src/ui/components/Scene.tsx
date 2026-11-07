import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { LifeStage } from '@engine/avatar';
import { stageSky } from '../theme/tokens';

const GROUND: Record<LifeStage, string> = {
  baby: '#F6C9A8',
  toddler: '#8AD17C',
  child: '#6CC26A',
  teen: '#4E9F6E',
  adult: '#4B5A7A',
  middle: '#3C4A66',
  senior: '#2F4A3E',
};

/** Layered backdrop that changes with life stage: sky, drifting clouds, skyline, ground. */
function SceneImpl({ stage, height, reduceMotion }: { stage: LifeStage; height: number; reduceMotion?: boolean }) {
  const drift = useRef(new Animated.Value(0)).current;
  const [top, bottom] = stageSky[stage] ?? stageSky.adult!;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(drift, { toValue: 1, duration: 38000, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, reduceMotion]);

  const night = stage === 'senior' || stage === 'teen';
  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: [-60, 420] });

  return (
    <View style={[StyleSheet.absoluteFill, { height }]} pointerEvents="none">
      <LinearGradient colors={[top, bottom]} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height={height} viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" style={StyleSheet.absoluteFill}>
        {night ? (
          <>
            <Circle cx={320} cy={60} r={22} fill="#FFF6D6" />
            <Circle cx={312} cy={54} r={22} fill={top} opacity={0.35} />
            {[[60, 40], [120, 70], [200, 30], [260, 80], [370, 120], [30, 110]].map(([x, y], i) => (
              <Circle key={i} cx={x} cy={y} r={1.8} fill="#FFFFFF" opacity={0.8} />
            ))}
          </>
        ) : (
          <Circle cx={320} cy={64} r={28} fill="#FFE27A" opacity={0.95} />
        )}
        <Skyline stage={stage} />
        <Rect x={0} y={252} width={400} height={60} fill={GROUND[stage]} />
        <Ellipse cx={200} cy={254} rx={260} ry={14} fill={GROUND[stage]} />
      </Svg>
      <Animated.View style={[styles.cloud, { top: 30, transform: [{ translateX }] }]}>
        <Svg width={70} height={30} viewBox="0 0 70 30">
          <Ellipse cx={22} cy={18} rx={20} ry={10} fill="#FFFFFF" opacity={0.75} />
          <Ellipse cx={42} cy={14} rx={18} ry={11} fill="#FFFFFF" opacity={0.75} />
          <Ellipse cx={54} cy={20} rx={14} ry={8} fill="#FFFFFF" opacity={0.75} />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.cloud, { top: 80, transform: [{ translateX: Animated.multiply(translateX, 0.6) }] }]}>
        <Svg width={50} height={22} viewBox="0 0 70 30">
          <Ellipse cx={22} cy={18} rx={20} ry={10} fill="#FFFFFF" opacity={0.55} />
          <Ellipse cx={46} cy={15} rx={18} ry={11} fill="#FFFFFF" opacity={0.55} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function Skyline({ stage }: { stage: LifeStage }) {
  if (stage === 'baby' || stage === 'toddler') {
    // cosy house
    return (
      <>
        <Rect x={40} y={190} width={100} height={64} fill="#FFD9B3" />
        <Path d="M30 192 L90 150 L150 192 Z" fill="#D6685F" />
        <Rect x={78} y={214} width={22} height={40} fill="#8A5A3C" />
        <Rect x={50} y={204} width={18} height={18} fill="#BFE6FF" />
        <Rect x={112} y={204} width={18} height={18} fill="#BFE6FF" />
      </>
    );
  }
  if (stage === 'child' || stage === 'teen') {
    // school
    return (
      <>
        <Rect x={250} y={178} width={130} height={76} fill="#E7C37A" />
        <Rect x={298} y={150} width={34} height={104} fill="#D8A95A" />
        <Path d="M290 152 L315 128 L340 152 Z" fill="#B24A4A" />
        {[262, 278, 340, 356].map((x) => (
          <Rect key={x} x={x} y={196} width={12} height={16} fill="#BFE6FF" />
        ))}
        <Rect x={309} y={222} width={12} height={32} fill="#6B4A2E" />
        <Circle cx={60} cy={200} r={22} fill="#3E8E57" />
        <Rect x={57} y={214} width={6} height={40} fill="#6B4A2E" />
      </>
    );
  }
  if (stage === 'adult' || stage === 'middle') {
    // city skyline
    return (
      <>
        {[
          [20, 150, 44], [70, 120, 40], [116, 170, 36], [158, 100, 46],
          [210, 160, 38], [254, 130, 44], [304, 175, 34], [344, 140, 40],
        ].map(([x, y, w], i) => (
          <Rect key={i} x={x} y={y} width={w} height={254 - (y ?? 0)} fill={stage === 'adult' ? '#4A5E8C' : '#34436A'} />
        ))}
        {[[30, 165], [80, 135], [168, 115], [264, 145], [354, 155]].map(([x, y], i) => (
          <Rect key={`w${i}`} x={x} y={y} width={6} height={8} fill="#FFE27A" opacity={0.9} />
        ))}
      </>
    );
  }
  // senior: cottage + tree
  return (
    <>
      <Rect x={250} y={196} width={110} height={58} fill="#C9A57A" />
      <Path d="M240 198 L305 156 L370 198 Z" fill="#7A4B3A" />
      <Rect x={296} y={218} width={20} height={36} fill="#5C3B28" />
      <Rect x={264} y={210} width={16} height={16} fill="#FFE27A" />
      <Circle cx={60} cy={196} r={30} fill="#2F7F55" />
      <Circle cx={84} cy={208} r={20} fill="#2F7F55" />
      <Rect x={56} y={210} width={8} height={44} fill="#5C3B28" />
    </>
  );
}

const styles = StyleSheet.create({ cloud: { position: 'absolute', left: 0 } });

export const Scene = memo(SceneImpl);
