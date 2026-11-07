import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { deleteSlot, listSlots, SlotInfo } from '../../store/saves';
import { Button, Card } from '../components/kit';
import { colors, spacing } from '../theme/tokens';
import ScreenFrame from './ScreenFrame';

interface Props {
  /** 'load' picks a save to play. 'pick' chooses which slot a new life will overwrite. */
  mode: 'load' | 'pick';
  onBack: () => void;
  onLoad: (slotId: number) => void;
  onPick: (slotId: number) => void;
}

const when = (t: number): string => (t ? new Date(t).toLocaleString() : '');

export default function SlotsScreen({ mode, onBack, onLoad, onPick }: Props) {
  const [slots, setSlots] = useState<SlotInfo[]>(listSlots);
  const [confirm, setConfirm] = useState<number | null>(null);

  const remove = (id: number) => {
    deleteSlot(id);
    setSlots(listSlots());
    setConfirm(null);
  };

  return (
    <ScreenFrame title={mode === 'pick' ? 'Choose a slot' : 'Load game'} onBack={onBack}>
      {mode === 'pick' ? (
        <Text style={styles.note}>
          All slots are full. Pick one to overwrite with your new life.
        </Text>
      ) : null}
      {slots.map((s) => (
        <Card key={s.slotId}>
          <Text style={styles.kicker}>SLOT {s.slotId + 1}</Text>
          {s.empty ? (
            <Text style={styles.muted}>Empty</Text>
          ) : (
            <>
              <Text style={styles.name}>
                {s.flag} {s.name}
              </Text>
              <Text style={styles.muted}>
                {s.damaged
                  ? 'This save could not be read.'
                  : `${s.alive ? `Age ${s.age}` : `Died at ${s.age}`} · Generation ${s.generation}${s.jobTitle ? ` · ${s.jobTitle}` : ''}`}
              </Text>
              {s.savedAt ? <Text style={styles.muted}>{when(s.savedAt)}</Text> : null}
            </>
          )}
          {confirm === s.slotId ? (
            <View style={styles.row}>
              <Button
                style={styles.flex}
                variant="ghost"
                label={mode === 'pick' ? 'Overwrite it' : 'Yes, delete'}
                onPress={() => (mode === 'pick' ? onPick(s.slotId) : remove(s.slotId))}
              />
              <Button
                style={styles.flex}
                variant="ghost"
                label="Cancel"
                onPress={() => setConfirm(null)}
              />
            </View>
          ) : (
            <View style={styles.row}>
              {mode === 'load' && !s.empty && !s.damaged ? (
                <Button
                  style={styles.flex}
                  variant="accent"
                  label="Play"
                  onPress={() => onLoad(s.slotId)}
                />
              ) : null}
              {mode === 'pick' ? (
                <Button
                  style={styles.flex}
                  variant="accent"
                  label={s.empty ? 'Use this slot' : 'Overwrite…'}
                  onPress={() => (s.empty ? onPick(s.slotId) : setConfirm(s.slotId))}
                />
              ) : null}
              {mode === 'load' && !s.empty ? (
                <Button
                  style={styles.flex}
                  variant="ghost"
                  label="Delete"
                  onPress={() => setConfirm(s.slotId)}
                />
              ) : null}
            </View>
          )}
        </Card>
      ))}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.muted, fontWeight: '600', lineHeight: 20 },
  kicker: { color: colors.accent, fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  name: { color: colors.text, fontSize: 20, fontWeight: '800' },
  muted: { color: colors.muted, fontWeight: '600' },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  flex: { flex: 1 },
});
