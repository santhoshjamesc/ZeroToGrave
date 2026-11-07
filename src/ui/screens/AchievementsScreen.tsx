import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { gameContent } from '@content/index';
import { loadMeta } from '../../store/meta';
import { Card } from '../components/kit';
import { colors, radius, spacing } from '../theme/tokens';
import ScreenFrame from './ScreenFrame';

export default function AchievementsScreen({ onBack }: { onBack: () => void }) {
  const meta = useMemo(loadMeta, []);
  const defs = gameContent.achievements;
  const done = defs.filter((d) => meta.achievements[d.id] !== undefined).length;

  return (
    <ScreenFrame title="Badges" onBack={onBack}>
      <Card>
        <Text style={styles.count}>
          {done} / {defs.length} unlocked
        </Text>
        <View style={styles.track}>
          <View
            style={[styles.fill, { width: `${defs.length ? (done / defs.length) * 100 : 0}%` }]}
          />
        </View>
      </Card>
      <View style={styles.grid}>
        {defs.map((d) => {
          const got = meta.achievements[d.id] !== undefined;
          return (
            <View
              key={d.id}
              style={[styles.tile, got && styles.tileOn]}
              accessible
              accessibilityLabel={`${d.name}. ${got ? 'Unlocked' : 'Locked'}. ${d.description}`}
            >
              <Text style={[styles.icon, !got && { opacity: 0.25 }]}>{got ? d.icon : '🔒'}</Text>
              <Text style={styles.name} numberOfLines={2}>
                {d.name}
              </Text>
              <Text style={styles.desc} numberOfLines={3}>
                {d.description}
              </Text>
            </View>
          );
        })}
      </View>
      {defs.length === 0 ? <Text style={styles.desc}>No badges to earn yet.</Text> : null}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  count: { color: colors.text, fontSize: 18, fontWeight: '800' },
  track: { height: 10, borderRadius: 6, backgroundColor: colors.surface, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 6, backgroundColor: colors.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '48.5%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileOn: { borderColor: colors.accent },
  icon: { fontSize: 34 },
  name: { color: colors.text, fontWeight: '800', textAlign: 'center' },
  desc: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});
