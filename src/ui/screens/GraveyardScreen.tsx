import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { loadMeta } from '../../store/meta';
import { Card } from '../components/kit';
import { colors, spacing } from '../theme/tokens';
import ScreenFrame from './ScreenFrame';

const money = (n: number): string =>
  `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;

export default function GraveyardScreen({ onBack }: { onBack: () => void }) {
  const meta = useMemo(loadMeta, []);
  return (
    <ScreenFrame title="Graveyard" onBack={onBack}>
      {meta.graveyard.length === 0 ? (
        <Card>
          <Text style={styles.stone}>🪦</Text>
          <Text style={styles.muted}>Nobody buried here yet. Everyone gets their turn.</Text>
        </Card>
      ) : null}
      {meta.graveyard.map((g) => (
        <View key={g.id} style={styles.stoneCard}>
          <Text style={styles.rip}>R.I.P.</Text>
          <Text style={styles.name}>
            {g.flag} {g.name}
          </Text>
          <Text style={styles.years}>
            {g.bornYear} – {g.bornYear + g.diedAtAge} · aged {g.diedAtAge}
          </Text>
          <Text style={styles.epitaph}>“{g.epitaph}”</Text>
          <Text style={styles.meta}>
            Died of {g.cause} · Gen {g.generation}
            {g.jobTitle ? ` · ${g.jobTitle}` : ''}
          </Text>
          <Text style={styles.meta}>
            {money(g.netWorth)} · {g.children} {g.children === 1 ? 'child' : 'children'} · 🏆{' '}
            {g.achievements}
          </Text>
        </View>
      ))}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.muted, fontWeight: '600', textAlign: 'center' },
  stone: { fontSize: 44, textAlign: 'center' },
  stoneCard: {
    backgroundColor: '#CDD2DC',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: 3,
    borderBottomWidth: 6,
    borderColor: '#4E9F6E',
  },
  rip: { color: '#5A6073', fontWeight: '900', letterSpacing: 4 },
  name: { color: '#2C3142', fontSize: 20, fontWeight: '900' },
  years: { color: '#3C4254', fontWeight: '700' },
  epitaph: { color: '#3C4254', fontStyle: 'italic', textAlign: 'center', marginVertical: 4 },
  meta: { color: '#5A6073', fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
