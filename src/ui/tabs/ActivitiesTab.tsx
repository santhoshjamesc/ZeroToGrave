import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { gameContent } from '@content/index';
import { activityBlocker, catchChance, crimeBlocker } from '@engine/index';
import type { ActivityCategory } from '@engine/content';
import { useSettings } from '@store/useSettings';
import { Button, Card, Chip } from '../components/kit';
import { colors } from '../theme/tokens';
import { Banner, common, FadeIn, fmt, pageStyle, SectionHeader, TabProps } from './shared';

type Cat = Exclude<ActivityCategory, 'crime'> | 'crime';

const CATS: { id: Cat; icon: string; label: string; color: string }[] = [
  { id: 'mind', icon: '🧠', label: 'Mind', color: '#5DA9FF' },
  { id: 'body', icon: '💪', label: 'Body', color: '#FF6B8A' },
  { id: 'social', icon: '🎉', label: 'Social', color: '#C58BFF' },
  { id: 'money', icon: '💸', label: 'Money', color: '#4ADE80' },
  { id: 'fun', icon: '🎮', label: 'Fun', color: '#FF9F4A' },
  { id: 'prison', icon: '⛓️', label: 'Prison', color: '#A3A9D4' },
  { id: 'crime', icon: '🕶️', label: 'Crime', color: '#FF6B6B' },
];

const riskLabel = (p: number): string => (p < 0.25 ? 'Low' : p < 0.4 ? 'Medium' : p < 0.6 ? 'High' : 'Very high');

export default function ActivitiesTab({ game, act, guarded }: TabProps) {
  const c = game.character;
  const { hardcore } = useSettings();
  const prison = c.crime.prison;
  const cats = CATS.filter((x) => (x.id === 'prison' ? !!prison : true));
  const [picked, setPicked] = useState<Cat>('mind');
  const cat: Cat = prison ? (picked === 'crime' ? 'crime' : 'prison') : picked === 'prison' ? 'mind' : picked;
  const meta = cats.find((x) => x.id === cat) ?? cats[0]!;
  const noTime = game.yearLoop.actionsLeft === 0;

  return (
    <ScrollView contentContainerStyle={pageStyle}>
      {prison && (
        <Banner tone="bad" text={`⛓️ Locked up for ${prison.yearsLeft} more year${prison.yearsLeft === 1 ? '' : 's'} (${prison.crime}). Only prison activities are open.`} />
      )}
      {noTime && <Banner tone="warn" text="⏳ No time left this year. Age up to get more activity slots." />}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {cats.map((x) => (
          <Pressable
            key={x.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: cat === x.id }}
            accessibilityLabel={x.label}
            onPress={() => setPicked(x.id)}
            style={[common.pill, cat === x.id && { backgroundColor: x.color }]}
          >
            <Text style={[common.pillText, cat === x.id && { color: colors.bg }]}>
              {x.icon} {x.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <SectionHeader icon={meta.icon} title={meta.label} color={meta.color} />

      {cat === 'crime' ? (
        <>
          <Banner tone="warn" text="Crime pays, until it doesn't. Getting caught means court, and maybe prison." />
          {gameContent.crimes.map((k) => {
            const why = crimeBlocker(c, k);
            return (
              <FadeIn key={k.id}>
                <Card style={{ borderColor: '#5A1F27' }}>
                  <View style={common.row}>
                    <Text style={common.icon}>{k.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={common.name}>{k.label}</Text>
                      <Text style={common.sub}>{k.blurb}</Text>
                    </View>
                  </View>
                  <View style={common.wrap}>
                    {k.reward[1] > 0 && <Chip text={`💰 ${fmt(k.reward[0])}–${fmt(k.reward[1])}`} tone="good" />}
                    <Chip text={`⛓️ ${k.sentence[0]}–${k.sentence[1]} yr if caught`} tone="bad" />
                    {!hardcore && <Chip text={`🚨 Risk: ${riskLabel(catchChance(c, k))}`} tone="bad" />}
                  </View>
                  {why && <Text style={common.reason}>{why}</Text>}
                  <Button label={`Do it: ${k.label}`} variant="ghost" disabled={guarded || !!why || noTime} onPress={() => act({ type: 'CRIME', id: k.id })} />
                </Card>
              </FadeIn>
            );
          })}
        </>
      ) : (
        gameContent.activities
          .filter((a) => a.category === cat && ((a.where ?? 'free') === 'prison') === !!prison)
          .map((a) => {
            const why = activityBlocker(c, a);
            return (
              <FadeIn key={a.id}>
                <Card>
                  <View style={common.row}>
                    <Text style={common.icon}>{a.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={common.name}>{a.label}</Text>
                      <Text style={common.sub}>{a.blurb}</Text>
                    </View>
                  </View>
                  <View style={common.wrap}>
                    <Chip text={a.cost > 0 ? `💵 ${fmt(a.cost)}` : '💵 Free'} tone={a.cost > 0 ? 'neutral' : 'good'} />
                    <Chip text={`⚡ ${a.energyCost}`} />
                  </View>
                  {why && <Text style={common.reason}>{why}</Text>}
                  <Button label={a.label} variant="ghost" disabled={guarded || !!why || noTime} onPress={() => act({ type: 'ACTIVITY', id: a.id })} />
                </Card>
              </FadeIn>
            );
          })
      )}
    </ScrollView>
  );
}
