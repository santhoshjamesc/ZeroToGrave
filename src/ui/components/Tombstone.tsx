import Svg, { Ellipse, Path, Rect, Text as SvgText } from 'react-native-svg';

export function Tombstone({ name, years, size = 200 }: { name: string; years: string; size?: number }) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 200 240" accessibilityLabel={`Gravestone of ${name}`}>
      <Ellipse cx={100} cy={222} rx={80} ry={12} fill="#00000040" />
      <Path d="M40 220 L40 90 Q40 36 100 36 Q160 36 160 90 L160 220 Z" fill="#B8BDC9" />
      <Path d="M48 214 L48 92 Q48 46 100 46 Q152 46 152 90 L152 214 Z" fill="#CDD2DC" />
      <Rect x={94} y={62} width={12} height={40} rx={3} fill="#8E94A3" />
      <Rect x={82} y={72} width={36} height={11} rx={3} fill="#8E94A3" />
      <SvgText x={100} y={130} fontSize={15} fontWeight="bold" fill="#3C4254" textAnchor="middle">
        R.I.P.
      </SvgText>
      <SvgText x={100} y={155} fontSize={13} fill="#3C4254" textAnchor="middle">
        {name.length > 16 ? `${name.slice(0, 15)}…` : name}
      </SvgText>
      <SvgText x={100} y={176} fontSize={12} fill="#5A6073" textAnchor="middle">
        {years}
      </SvgText>
      <Path d="M30 222 q8 -16 14 0 M156 222 q8 -14 14 0" stroke="#4E9F6E" strokeWidth={4} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
