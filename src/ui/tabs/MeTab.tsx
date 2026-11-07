import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { gameContent } from '@content/index';
import { CHECKUP_COST, Condition, diseaseFor, EDUCATION_NAMES, FAMILY_WEALTH, familyWealthOf, netWorth, traitDefs, treatmentCost } from '@engine/index';
import { useSettings } from '@store/useSettings';
import { Button, Card, Chip, StatBar, Title } from '../components/kit';
import { colors, radius, spacing } from '../theme/tokens';
import { TabProps } from './types';

type Panel = 'self' | 'health' | 'stats' | 'story' | 'badges';
const PANELS: { id: Panel; label: string }[] = [
  { id: 'self', label: '🧬 You' },
  { id: 'health', label: '🩺 Health' },
  { id: 'stats', label: '📊 Stats' },
  { id: 'story', label: '📜 Story' },
  { id: 'badges', label: '🏆 Badges' },
];

const money = (n: number): string => `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;
const LIFESTYLE: Record<string, string> = {
  smoker: '🚬 Smoker',
  drinker: '🍺 Drinker',
  junkfood: '🍕 Junk food',
  gambler: '🎰 Gambler',
  drugs: '💊 Drug use',
};

export default function MeTab(props: TabProps) {
  const [panel, setPanel] = useState<Panel>('self');
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.seg} accessibilityRole="tablist">
        {PANELS.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="tab"
            accessibilityLabel={p.label}
            accessibilityState={{ selected: panel === p.id }}
            onPress={() => setPanel(p.id)}
            style={[styles.segBtn, panel === p.id && styles.segOn]}
          >
            <Text style={[styles.segText, panel === p.id && { color: colors.bg }]}>{p.label}</Text>
          </Pressable>
        ))}
      </View>
      {panel === 'self' && <Self {...props} />}
      {panel === 'health' && <Health {...props} />}
      {panel === 'stats' && <Stats {...props} />}
      {panel === 'story' && <Story {...props} />}
      {panel === 'badges' && <Badges {...props} />}
    </ScrollView>
  );
}

function Self({ game }: TabProps) {
  const c = game.character;
  const wealth = FAMILY_WEALTH[familyWealthOf(c)];
  const defs = traitDefs(c.traits, gameContent.traits);
  return (
    <>
      <Card>
        <Title>🧬 Personality</Title>
        {defs.length === 0 && <Text style={styles.hint}>You have not found your personality yet.</Text>}
        {defs.map((d) => (
          <View key={d.id} style={{ gap: 2 }}>
            <Text style={styles.hint}>
              {d.icon} <Text style={{ color: colors.text, fontWeight: '800' }}>{d.label}</Text>
            </Text>
            <Text style={styles.hint}>{d.blurb}</Text>
          </View>
        ))}
        <Text style={styles.hint}>Life can add to this. Big moments leave marks.</Text>
      </Card>
      <Card>
        <Title>{wealth.icon} {wealth.label}</Title>
        <Text style={styles.hint}>{wealth.blurb}</Text>
        <Text style={styles.hint}>
          Born in {c.identity.city}, {c.identity.country} {c.identity.flag} · {c.identity.zodiac}
        </Text>
      </Card>
    </>
  );
}

function Pips({ n }: { n: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }} accessible accessibilityLabel={`Severity ${n} of 4`}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.pip, i <= n && { backgroundColor: n >= 3 ? colors.bad : colors.accent }]} />
      ))}
    </View>
  );
}

function Health({ game, act, guarded }: TabProps) {
  const { hardcore } = useSettings();
  const c = game.character;
  const known = c.conditions.filter((k) => k.diagnosed);
  const hidden = c.conditions.length - known.length;
  const flags = Object.keys(LIFESTYLE).filter((f) => c.flags[f]);

  const treatRow = (k: Condition, surgery: boolean) => {
    const d = diseaseFor(gameContent, k.id);
    const cost = c.age < 18 ? 0 : treatmentCost(d, k, surgery);
    const odds = Math.round(Math.min(97, Math.max(15, ((d?.treatSuccess ?? 0.6) + (surgery ? 0.2 : 0) - (k.severity - 1) * 0.05) * 100)));
    const text = `${surgery ? '🔪 Surgery' : '💊 Treat'} · ${cost ? money(cost) : 'free'}${hardcore ? '' : ` · ~${odds}%`}`;
    return (
      <View key={String(surgery)} style={{ flex: 1 }}>
        <Button
          small
          variant="ghost"
          label={text}
          disabled={guarded || (!surgery && k.treated && k.chronic)}
          onPress={() => act({ type: 'TREAT', conditionId: k.id, surgery })}
        />
      </View>
    );
  };

  return (
    <>
      <Card>
        <StatBar stat="health" value={c.stats.health} />
        {hidden > 0 && <Text style={styles.hint}>❓ Something doesn’t feel right…</Text>}
        {c.conditions.length === 0 && <Text style={styles.hint}>No known conditions. Keep it up!</Text>}
        <Button
          label={`🩺 Get a check-up (${c.age < 18 ? 'free' : money(CHECKUP_COST)})`}
          disabled={guarded}
          onPress={() => act({ type: 'CHECKUP' })}
        />
      </Card>
      {known.map((k) => (
        <Card key={k.id}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{k.icon} {k.name}</Text>
            <Pips n={k.severity} />
          </View>
          <View style={styles.chips}>
            <Chip text={k.chronic ? 'Chronic' : 'Acute'} />
            <Chip text={k.kind} />
            {k.treated && <Chip text="Treated" tone="good" />}
            <Chip text={`since ${k.sinceAge}`} />
          </View>
          <View style={styles.rowBetween}>
            {treatRow(k, false)}
            {k.severity >= 3 && treatRow(k, true)}
          </View>
        </Card>
      ))}
      {flags.length > 0 && (
        <Card>
          <Title>Lifestyle</Title>
          <View style={styles.chips}>
            {flags.map((f) => (
              <Chip key={f} text={LIFESTYLE[f] ?? f} tone="bad" />
            ))}
          </View>
        </Card>
      )}
    </>
  );
}

function Stats({ game }: TabProps) {
  const c = game.character;
  return (
    <>
      <Card>
        {(['health', 'happiness', 'smarts', 'looks', 'karma', 'energy'] as const).map((k) => (
          <StatBar key={k} stat={k} value={c.stats[k]} />
        ))}
      </Card>
      <Card>
        <Title>About</Title>
        <View style={styles.chips}>
          <Chip text={`${c.identity.flag} ${c.identity.country}`} />
          <Chip text={`🏙️ ${c.identity.city}`} />
          <Chip text={`♈ ${c.identity.zodiac}`} />
          <Chip text={`🎂 Born ${c.identity.birthYear}`} />
          <Chip text={`💰 ${money(c.money)}`} />
          <Chip text={c.job ? `💼 ${c.job.title} · ${money(c.job.salary)}/yr` : c.retired ? '🏖️ Retired' : '💼 No job yet'} />
        </View>
      </Card>
      <Card>
        <Title>Lifetime</Title>
        <View style={styles.chips}>
          <Chip text={`⏳ Age ${c.age}`} />
          <Chip text={`🎓 ${EDUCATION_NAMES[c.education.level]}`} />
          <Chip text={`💎 Net worth ${money(netWorth(c))}`} tone={netWorth(c) < 0 ? 'bad' : 'neutral'} />
          <Chip text={`👶 ${c.relationships.filter((r) => r.kind === 'child').length} children`} />
          <Chip text={`⛓️ ${c.crime.record.length} convictions`} tone={c.crime.record.length ? 'bad' : 'neutral'} />
        </View>
      </Card>
    </>
  );
}

function Story({ game }: TabProps) {
  const entries = [...game.character.log].reverse();
  const groups: { age: number; items: typeof entries }[] = [];
  for (const e of entries) {
    const last = groups[groups.length - 1];
    if (last && last.age === e.age) last.items.push(e);
    else groups.push({ age: e.age, items: [e] });
  }
  return (
    <View style={{ gap: spacing.md }}>
      <Title>Your story</Title>
      {groups.map((g) => (
        <View key={g.age} style={styles.group}>
          <Text style={styles.age}>Age {g.age}</Text>
          {g.items.map((e, i) => (
            <View key={i} style={styles.logRow}>
              <View style={styles.dot}>
                <Text style={{ fontSize: 16 }}>{e.icon}</Text>
              </View>
              <Text style={styles.logText}>{e.text}</Text>
            </View>
          ))}
          <View style={styles.line} />
        </View>
      ))}
    </View>
  );
}

function Badges({ game }: TabProps) {
  const all = gameContent.achievements;
  return (
    <>
      <Title>🏆 {game.achievements.length} / {all.length} unlocked</Title>
      <View style={styles.grid}>
        {all.map((a) => {
          const on = game.achievements.includes(a.id);
          return (
            <View
              key={a.id}
              style={[styles.badge, on && styles.badgeOn, !on && { opacity: 0.45 }]}
              accessible
              accessibilityLabel={`${a.name}, ${on ? 'unlocked' : 'locked'}. ${a.description}`}
            >
              <Text style={{ fontSize: 28 }}>{on ? a.icon : '🔒'}</Text>
              <Text style={styles.badgeName}>{a.name}</Text>
              <Text style={styles.badgeDesc}>{a.description}</Text>
            </View>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  seg: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.pill, padding: 4 },
  segBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.pill },
  segOn: { backgroundColor: colors.accent },
  segText: { color: colors.muted, fontWeight: '800', fontSize: 12 },
  hint: { color: colors.muted, fontWeight: '600' },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800', flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pip: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  group: { gap: spacing.sm, paddingLeft: 4 },
  age: { color: colors.accent, fontWeight: '900', fontSize: 13 },
  logRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  dot: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  line: { position: 'absolute', left: 21, top: 22, bottom: -18, width: 2, backgroundColor: colors.border, zIndex: -1 },
  logText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 21 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: { width: '48%', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.sm, gap: 2, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  badgeOn: { borderColor: colors.accent },
  badgeName: { color: colors.text, fontWeight: '800', textAlign: 'center' },
  badgeDesc: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});
