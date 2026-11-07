import { StyleSheet, Text, View } from 'react-native';
import { estateFor, GameState, graveEntry, heirCandidates } from '@engine/index';
import { Avatar } from './Avatar';
import { Button, Card, Chip, Title } from './kit';
import { personSpec } from '@engine/index';
import { colors, spacing } from '../theme/tokens';

const money = (n: number): string => `$${Math.round(n).toLocaleString('en-US')}`;

/** Shown when the character has died: summary, epitaph and the chance to play on as an heir. */
export function DeathPanel({
  game,
  onHeir,
  onNewLife,
  onExit,
}: {
  game: GameState;
  onHeir: (childId: string) => void;
  onNewLife: () => void;
  onExit: () => void;
}) {
  const c = game.character;
  const grave = graveEntry(game);
  const heirs = heirCandidates(game);
  const estate = estateFor(c);
  return (
    <View style={{ gap: spacing.md }}>
      <Card>
        <Title>🪦 Rest in peace</Title>
        <Text style={styles.body}>
          {c.name} died at {grave.diedAtAge} of {grave.cause}.
        </Text>
        <Text style={styles.epitaph}>“{grave.epitaph}”</Text>
        <View style={styles.chips}>
          <Chip text={`💰 Net worth ${money(grave.netWorth)}`} />
          <Chip text={`🏆 ${grave.achievements} badges`} />
          <Chip text={`👶 ${grave.children} kids`} />
          <Chip text={`🧬 Generation ${game.generation}`} />
          {grave.jobTitle ? <Chip text={`💼 ${grave.jobTitle}`} /> : null}
        </View>
      </Card>

      {heirs.length > 0 && (
        <Card>
          <Title>🧬 Carry on the family</Title>
          <Text style={styles.body}>
            Play on as one of {c.name.split(' ')[0]}’s children. They inherit {money(estate.cash)} (after 30% estate tax)
            and every asset.
          </Text>
          {heirs.map((h) => (
            <View key={h.id} style={styles.heirRow}>
              <Avatar spec={personSpec(h, c.identity.appearance)} size={64} bust />
              <View style={{ flex: 1 }}>
                <Text style={styles.heirName}>{h.name}</Text>
                <Text style={styles.sub}>Age {h.age ?? 0}</Text>
              </View>
              <Button small variant="accent" label="Play as" onPress={() => onHeir(h.id)} />
            </View>
          ))}
        </Card>
      )}

      <Button label="Live another life" variant={heirs.length ? 'ghost' : 'accent'} onPress={onNewLife} />
      <Button label="Back to menu" variant="ghost" onPress={onExit} />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.text, fontSize: 16, lineHeight: 22 },
  epitaph: { color: colors.accent, fontSize: 17, fontStyle: 'italic', fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  heirRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heirName: { color: colors.text, fontSize: 17, fontWeight: '800' },
  sub: { color: colors.muted, fontWeight: '600' },
});
