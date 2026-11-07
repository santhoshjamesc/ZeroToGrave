import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { identityPools } from '@content/index';
import { avatarSpec, GameState, newRandomGame } from '@engine/index';
import { Avatar } from '../components/Avatar';
import { Scene } from '../components/Scene';
import { Button, Card, Chip } from '../components/kit';
import { colors, spacing } from '../theme/tokens';

const randomSeed = (): number => Math.floor(Math.random() * 2147483646) + 1;

/** Roll a random life. Name, gender, country, city, look and family all come from one seed. */
export default function NewLifeScreen({
  onStart,
  onBack,
}: {
  onStart: (g: GameState) => void;
  onBack?: () => void;
}) {
  const [seed, setSeed] = useState(randomSeed);
  const game = useMemo(() => newRandomGame(seed, identityPools, new Date().getFullYear()), [seed]);
  const c = game.character;
  const spec = useMemo(() => avatarSpec(c), [c]);

  return (
    <ScrollView contentContainerStyle={styles.wrap} bounces={false}>
      <View style={styles.hero}>
        <Scene stage="baby" height={380} />
        <Text style={styles.logo}>ZeroToGrave</Text>
        {onBack ? (
          <View style={styles.back}>
            <Button small variant="ghost" label="‹ Back" onPress={onBack} />
          </View>
        ) : null}
        <View style={styles.avatarWrap}>
          <Avatar spec={spec} size={200} />
        </View>
      </View>

      <View style={styles.body}>
        <Card>
          <Text style={styles.name}>{c.name}</Text>
          <View style={styles.chips}>
            <Chip text={`${c.identity.flag} ${c.identity.city}, ${c.identity.country}`} />
            <Chip text={c.identity.gender === 'nonbinary' ? 'Non-binary' : c.identity.gender === 'male' ? 'Boy' : 'Girl'} />
            <Chip text={`♈ ${c.identity.zodiac}`} />
          </View>
          <Text style={styles.sub}>Born into a family of {c.relationships.length + 1}:</Text>
          {c.relationships.map((r) => (
            <Text key={r.id} style={styles.fam}>
              {r.kind === 'parent' ? (r.gender === 'female' ? '👩 Mother' : '👨 Father') : '🧒 Sibling'} · {r.name} ({r.age})
            </Text>
          ))}
          <Text style={styles.hint}>Tap your baby to say hi 👆</Text>
        </Card>

        <Button label="🎲 Roll a different life" variant="ghost" onPress={() => setSeed(randomSeed())} />
        <Button label="Start this life" variant="accent" onPress={() => onStart(game)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: spacing.xl },
  hero: { height: 380, alignItems: 'center', overflow: 'hidden' },
  back: { position: 'absolute', top: 44, left: 12 },
  logo: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 56, letterSpacing: 1 },
  avatarWrap: { position: 'absolute', bottom: -8 },
  body: { padding: spacing.md, gap: spacing.md },
  name: { color: colors.text, fontSize: 26, fontWeight: '900' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sub: { color: colors.muted, marginTop: spacing.sm, fontWeight: '700' },
  fam: { color: colors.text, fontSize: 15 },
  hint: { color: colors.accent, marginTop: spacing.sm, fontWeight: '700' },
});
