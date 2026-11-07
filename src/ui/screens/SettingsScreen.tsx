import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { resetMeta } from '../../store/meta';
import { deleteSlot, SLOT_COUNT } from '../../store/saves';
import { Settings, updateSettings } from '../../store/settings';
import { useSettings } from '../../store/useSettings';
import { Button, Card, Title } from '../components/kit';
import { colors, spacing } from '../theme/tokens';
import ScreenFrame from './ScreenFrame';

const ROWS: { key: keyof Settings; label: string; hint: string }[] = [
  { key: 'sound', label: '🔊 Sound effects', hint: 'Taps, chimes and the age-up fanfare.' },
  { key: 'music', label: '🎵 Music', hint: 'Calm ambient background loop.' },
  { key: 'haptics', label: '📳 Haptics', hint: 'Vibration feedback on taps and big moments.' },
  { key: 'hardcore', label: '💀 Hardcore', hint: 'Hides the risk hints on choices.' },
];

export default function SettingsScreen({
  onBack,
  onWiped,
}: {
  onBack: () => void;
  onWiped: () => void;
}) {
  const s = useSettings();
  const [confirm, setConfirm] = useState(false);

  const wipe = () => {
    for (let i = 0; i < SLOT_COUNT; i++) deleteSlot(i);
    resetMeta();
    setConfirm(false);
    onWiped();
  };

  return (
    <ScreenFrame title="Settings" onBack={onBack}>
      <Card>
        {ROWS.map((r) => (
          <View key={r.key} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{r.label}</Text>
              <Text style={styles.hint}>{r.hint}</Text>
            </View>
            <Switch
              value={s[r.key]}
              onValueChange={(v) => void updateSettings({ [r.key]: v })}
              trackColor={{ true: colors.primary, false: colors.surface }}
              thumbColor={s[r.key] ? colors.accent : colors.muted}
              accessibilityLabel={r.label}
            />
          </View>
        ))}
      </Card>
      <Card>
        <Title>Your data</Title>
        <Text style={styles.hint}>
          Everything is stored on this device only. Nothing is ever uploaded.
        </Text>
        {confirm ? (
          <View style={styles.confirm}>
            <Text style={[styles.label, { color: colors.bad }]}>
              Delete all saves, badges and graves?
            </Text>
            <Button variant="ghost" label="Yes, delete everything" onPress={wipe} />
            <Button variant="ghost" label="Cancel" onPress={() => setConfirm(false)} />
          </View>
        ) : (
          <Button variant="ghost" label="🗑 Delete all data" onPress={() => setConfirm(true)} />
        )}
      </Card>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  label: { color: colors.text, fontSize: 16, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  confirm: { gap: spacing.sm },
});
