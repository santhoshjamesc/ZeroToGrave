import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { interactionsFor, personSpec, Relationship } from '@engine/index';
import { Avatar } from '../components/Avatar';
import { Button, Card, Chip, Title } from '../components/kit';
import { colors, spacing } from '../theme/tokens';
import { TabProps } from './types';

const STATUS: Record<string, string> = {
  dating: 'Dating',
  engaged: 'Engaged',
  married: 'Married',
  divorced: 'Divorced',
  exes: 'Ex',
};

function label(r: Relationship): string {
  switch (r.kind) {
    case 'parent':
      return r.gender === 'female' ? 'Mother' : r.gender === 'male' ? 'Father' : 'Parent';
    case 'partner':
      return STATUS[r.status ?? 'dating'] ?? 'Partner';
    case 'ex':
      return r.status === 'divorced' ? 'Ex-spouse' : 'Ex';
    case 'child':
      return r.gender === 'female' ? 'Daughter' : r.gender === 'male' ? 'Son' : 'Child';
    default:
      return r.kind[0]?.toUpperCase() + r.kind.slice(1);
  }
}

/** Red → amber → green as closeness rises. */
function closenessColor(v: number): string {
  if (v < 30) return '#FF6B6B';
  if (v < 60) return '#FFD166';
  return '#4ADE80';
}

export default function PeopleTab({ game, act, guarded }: TabProps) {
  const c = game.character;
  const [open, setOpen] = useState<string | null>(null);
  const living = c.relationships.filter((r) => !r.deceased);
  const gone = c.relationships.filter((r) => r.deceased);

  const sections: { title: string; people: Relationship[] }[] = [
    { title: '💞 Partner', people: living.filter((r) => r.kind === 'partner') },
    { title: '🏠 Family', people: living.filter((r) => r.kind === 'parent' || r.kind === 'sibling') },
    { title: '👶 Children', people: living.filter((r) => r.kind === 'child') },
    { title: '🤝 Friends', people: living.filter((r) => r.kind === 'friend' || r.kind === 'coworker' || r.kind === 'rival') },
    { title: '💔 Exes', people: living.filter((r) => r.kind === 'ex') },
  ];

  const renderPerson = (r: Relationship) => {
    const expanded = open === r.id;
    const options = interactionsFor(c, r);
    return (
      <Card key={r.id} style={r.deceased ? styles.gone : undefined}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${r.name}, ${label(r)}. Tap for actions`}
          accessibilityState={{ expanded }}
          onPress={() => setOpen(expanded ? null : r.id)}
          style={styles.row}
        >
          <Avatar spec={personSpec(r, c.identity.appearance)} size={72} bust />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.name}>{r.deceased ? '🕯️ ' : ''}{r.name}</Text>
            <Text style={styles.sub}>
              {label(r)} · age {r.age ?? '?'}
            </Text>
            {r.blurb ? <Text style={styles.blurb}>{r.blurb}</Text> : null}
            {!r.deceased && (
              <>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${r.closeness}%`, backgroundColor: closenessColor(r.closeness) }]} />
                </View>
                <Text style={styles.sub}>Closeness {Math.round(r.closeness)}</Text>
              </>
            )}
          </View>
        </Pressable>
        {expanded && !r.deceased && (
          <View style={styles.actions}>
            {options.map((o) => (
              <View key={o.id} style={styles.actionRow}>
                <View style={{ flex: 1 }}>
                  <Button
                    small
                    variant="ghost"
                    label={`${o.icon} ${o.label}`}
                    disabled={guarded || !!o.disabled}
                    onPress={() => act({ type: 'RELATE', personId: r.id, interaction: o.id })}
                  />
                </View>
                {o.cost ? <Chip text={`$${o.cost.toLocaleString()}`} /> : null}
                {o.disabled ? <Text style={styles.why}>{o.disabled}</Text> : null}
              </View>
            ))}
          </View>
        )}
      </Card>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Card>
        <Title>👪 Generation {game.generation} · {c.identity.surname} family</Title>
        {game.lineage.length > 0 ? (
          <Text style={styles.sub}>
            Ancestors: {game.lineage.map((l) => `${l.name} (${l.diedAtAge})`).join(' → ')}
          </Text>
        ) : (
          <Text style={styles.sub}>The first of the line. Make it count.</Text>
        )}
      </Card>

      <View style={styles.header}>
        {c.age >= 14 && (
          <View style={{ flex: 1 }}>
            <Button label="💘 Look for love" disabled={guarded} onPress={() => act({ type: 'MEET_PERSON', intent: 'love' })} />
          </View>
        )}
        {c.age >= 13 && (
          <View style={{ flex: 1 }}>
            <Button label="🤝 Make a friend" variant="ghost" disabled={guarded} onPress={() => act({ type: 'MEET_PERSON', intent: 'friend' })} />
          </View>
        )}
      </View>

      {living.length === 0 && <Text style={styles.sub}>You are on your own.</Text>}
      {sections.map((s) =>
        s.people.length === 0 ? null : (
          <View key={s.title} style={{ gap: spacing.sm }}>
            <Text style={styles.section}>{s.title}</Text>
            {s.people.map(renderPerson)}
          </View>
        ),
      )}
      {gone.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.section}>🕯️ Passed away</Text>
          {gone.map(renderPerson)}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', gap: spacing.sm },
  section: { color: colors.accent, fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { color: colors.text, fontSize: 17, fontWeight: '800' },
  sub: { color: colors.muted, fontWeight: '600' },
  blurb: { color: colors.muted, fontSize: 13, fontStyle: 'italic' },
  track: { height: 8, backgroundColor: colors.surface, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  gone: { opacity: 0.5 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  why: { color: colors.muted, fontSize: 12, width: '100%' },
});
