import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import {
  Character,
  FOCUS_AREAS,
  GameState,
  MIN_AGING_MS,
  STAT_KEYS,
  totalAllocated,
  YearAction,
  YearLoopState,
} from '@engine/index';
import { successHaptic, warnHaptic } from '../feedback';
import { colors, focusIcons, spacing, statIcons } from '../theme/tokens';
import { useSettings } from '@store/useSettings';
import { DeathPanel } from './DeathPanel';
import { Button, Card, Chip, Title } from './kit';

interface Props {
  game: GameState;
  c: Character;
  loop: YearLoopState;
  guarded: boolean;
  dispatch: (a: YearAction) => void;
  onAgeUp: () => void;
  onNewLife: () => void;
  onExit: () => void;
  onHeir: (childId: string) => void;
}

/** The Year Loop, as a stack of friendly cards. UI only dispatches engine actions. */
export default function YearPanel({ game, c, loop, guarded, dispatch, onAgeUp, onNewLife, onExit, onHeir }: Props) {
  const { hardcore } = useSettings();
  const left = loop.focusBudget - totalAllocated(loop.allocation);
  const open = loop.pendingEvents.find((e) => e.resolvedChoiceId === null);
  const lastYear = loop.history[loop.history.length - 1];

  // Age-up progress bar: purely visual, the engine enforces the real minimum.
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (loop.phase !== 'AGING') {
      progress.setValue(0);
      return;
    }
    Animated.timing(progress, { toValue: 1, duration: MIN_AGING_MS, easing: Easing.linear, useNativeDriver: false }).start();
  }, [loop.phase, progress]);

  if (loop.phase === 'DEAD') {
    return <DeathPanel game={game} onHeir={onHeir} onNewLife={onNewLife} onExit={onExit} />;
  }

  if (loop.phase === 'BRIEFING') {
    const entries = Object.entries(lastYear?.statDeltas ?? {}) as [(typeof STAT_KEYS)[number], number][];
    return (
      <Card>
        <Title>{lastYear ? `Age ${c.age} begins` : 'A new life begins'}</Title>
        {lastYear ? (
          <View style={styles.chips}>
            {entries.length === 0 && <Chip text="Nothing changed" />}
            {entries.map(([k, v]) => (
              <Chip key={k} text={`${statIcons[k]} ${v > 0 ? '+' : ''}${v}`} tone={v > 0 ? 'good' : 'bad'} />
            ))}
          </View>
        ) : (
          <Text style={styles.body}>Welcome, {c.name.split(' ')[0]}. Every year you choose where your time goes.</Text>
        )}
        {lastYear?.cashflow && (
          <View style={styles.chips}>
            <Chip text={`💵 In $${lastYear.cashflow.income.toLocaleString('en-US')}`} tone="good" />
            <Chip text={`🧾 Out $${lastYear.cashflow.expenses.toLocaleString('en-US')}`} tone="bad" />
          </View>
        )}
        {(lastYear?.notes ?? []).map((n) => (
          <Text key={n} style={styles.note}>• {n}</Text>
        ))}
        <Button label="Plan the year" disabled={guarded} onPress={() => dispatch({ type: 'ACK_BRIEFING' })} />
      </Card>
    );
  }

  if (loop.phase === 'FOCUS') {
    return (
      <Card>
        <Title>Where does your time go?</Title>
        <View style={styles.pips}>
          {Array.from({ length: loop.focusBudget }).map((_, i) => (
            <View key={i} style={[styles.pip, i < left && styles.pipOn]} />
          ))}
          <Text style={styles.pipText}>{left} left</Text>
        </View>
        {FOCUS_AREAS.map((a) => (
          <View key={a} style={styles.row}>
            <Text style={styles.focusIcon}>{focusIcons[a]}</Text>
            <Text style={[styles.body, { flex: 1 }]}>{a === 'sideHustle' ? 'Side hustle' : a[0]?.toUpperCase() + a.slice(1)}</Text>
            <Button small variant="ghost" label="−" disabled={loop.allocation[a] === 0} onPress={() => dispatch({ type: 'SET_FOCUS', area: a, points: loop.allocation[a] - 1 })} />
            <Text style={styles.count}>{loop.allocation[a]}</Text>
            <Button small variant="ghost" label="+" disabled={left === 0} onPress={() => dispatch({ type: 'SET_FOCUS', area: a, points: loop.allocation[a] + 1 })} />
          </View>
        ))}
        <Button label="😴 Bank the rest as Rest" variant="ghost" disabled={left === 0} onPress={() => dispatch({ type: 'BANK_REMAINING_AS_REST' })} />
        <Button label="Lock it in" disabled={left !== 0 || guarded} onPress={() => dispatch({ type: 'CONFIRM_FOCUS' })} />
      </Card>
    );
  }

  if (loop.phase === 'DECISIONS') {
    if (!open) {
      return (
        <Card>
          <Title>All decided</Title>
          <Button label="Review the year" disabled={guarded} onPress={() => dispatch({ type: 'PROCEED_TO_COMMIT' })} />
        </Card>
      );
    }
    return (
      <Card>
        <Text style={styles.kicker}>EVENT</Text>
        <Title>{open.def.title}</Title>
        <Text style={styles.body}>{open.def.text}</Text>
        {open.def.choices.map((ch) => (
          <Button
            key={ch.id}
            variant="ghost"
            disabled={guarded}
            label={`${ch.label}${hardcore ? '' : ch.riskHint === 'risky' ? '  🔥' : ch.riskHint === 'gamble' ? '  🎲' : ''}`}
            onPress={() => {
              if (ch.riskHint === 'gamble' || ch.riskHint === 'risky') warnHaptic();
              dispatch({ type: 'RESOLVE_EVENT', eventId: open.eventId, choiceId: ch.id });
            }}
          />
        ))}
      </Card>
    );
  }

  if (loop.phase === 'COMMIT') {
    return (
      <Card>
        <Title>Your year in review</Title>
        {loop.pendingEvents.map((e) => (
          <Text key={e.eventId} style={styles.body}>
            📖 {e.def.title}: <Text style={{ color: colors.accent }}>{e.def.choices.find((ch) => ch.id === e.resolvedChoiceId)?.label}</Text>
          </Text>
        ))}
        <Button
          label="⏳ Age up"
          variant="accent"
          disabled={guarded}
          onPress={() => {
            successHaptic();
            onAgeUp();
          }}
        />
      </Card>
    );
  }

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <Card>
      <Title>Time passes…</Title>
      <Text style={styles.age}>
        {c.age} → {c.age + 1}
      </Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width }]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.text, fontSize: 16, lineHeight: 22 },
  note: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  kicker: { color: colors.accent, fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  focusIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  count: { color: colors.text, width: 24, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  pips: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pip: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  pipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  pipText: { color: colors.muted, marginLeft: 6, fontWeight: '700' },
  age: { color: colors.accent, fontSize: 44, fontWeight: '900', textAlign: 'center' },
  track: { height: 10, borderRadius: 6, backgroundColor: colors.surface, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 6, backgroundColor: colors.accent },
});
