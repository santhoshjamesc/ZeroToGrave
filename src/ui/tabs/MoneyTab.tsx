import { ScrollView, Text, View } from 'react-native';
import { gameContent } from '@content/index';
import type { AssetOffer } from '@engine/content';
import { AGE_GATES, buyBlocker, netWorth } from '@engine/index';
import { Button, Card, Chip, Title } from '../components/kit';
import { colors } from '../theme/tokens';
import { common, FadeIn, fmt, LockedCard, pageStyle, SectionHeader, TabProps } from './shared';

const riskLabel = (sd: number): string => (sd < 0.05 ? 'Low risk' : sd < 0.2 ? 'Medium risk' : sd < 0.5 ? 'High risk' : 'Extreme risk');
const GROUPS: { kind: AssetOffer['kind']; icon: string; title: string; color: string }[] = [
  { kind: 'home', icon: '🏠', title: 'Homes', color: '#5DA9FF' },
  { kind: 'vehicle', icon: '🚗', title: 'Vehicles', color: '#FF9F4A' },
  { kind: 'investment', icon: '📈', title: 'Investments', color: '#4ADE80' },
  { kind: 'business', icon: '🏢', title: 'Businesses', color: '#C58BFF' },
];

export default function MoneyTab({ game, act, guarded }: TabProps) {
  const c = game.character;
  const last = game.yearLoop.history[game.yearLoop.history.length - 1];
  const nw = netWorth(c);

  return (
    <ScrollView contentContainerStyle={pageStyle}>
      <SectionHeader icon="💰" title="Finances" color={colors.accent} />
      <Card>
        <View style={common.row}>
          <View style={{ flex: 1 }}>
            <Text style={common.sub}>Cash</Text>
            <Text style={common.big}>{fmt(c.money)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={common.sub}>Net worth</Text>
            <Text style={[common.big, { color: nw >= 0 ? colors.good : colors.bad }]}>{fmt(nw)}</Text>
          </View>
        </View>
        {last?.cashflow ? (
          <>
            <Text style={common.sub}>Last year (age {last.age})</Text>
            <View style={common.wrap}>
              <Chip text={`⬆️ ${fmt(last.cashflow.income)}`} tone="good" />
              <Chip text={`⬇️ ${fmt(last.cashflow.expenses)}`} tone="bad" />
              <Chip text={`Net ${fmt(last.cashflow.net)}`} tone={last.cashflow.net >= 0 ? 'good' : 'bad'} />
            </View>
            {(last.notes ?? []).map((n) => (
              <Text key={n} style={common.sub}>• {n}</Text>
            ))}
          </>
        ) : (
          <Text style={common.sub}>Cash flow shows up after your first year.</Text>
        )}
      </Card>

      {c.debt > 0 && (
        <Card style={{ borderColor: '#5A1F27' }}>
          <Title>💳 Debt: {fmt(c.debt)}</Title>
          <Text style={common.sub}>Grows 6% a year. You pay 10% automatically when you can.</Text>
          <View style={common.wrap}>
            {[500, 5000].map((n) => (
              <Button key={n} small variant="ghost" label={`Repay ${fmt(n)}`} disabled={guarded || c.money < 1} onPress={() => act({ type: 'REPAY_DEBT', amount: n })} />
            ))}
            <Button small variant="ghost" label="Repay all you can" disabled={guarded || c.money < 1} onPress={() => act({ type: 'REPAY_DEBT', amount: c.debt })} />
          </View>
        </Card>
      )}

      <SectionHeader icon="🧾" title="Your assets" color="#4ADE80" />
      {c.assets.length === 0 && <Text style={common.sub}>You own nothing yet. Browse the shop below.</Text>}
      {c.assets.map((a) => {
        const gain = a.value - a.cost;
        return (
          <FadeIn key={a.id}>
            <Card>
              <View style={common.row}>
                <Text style={common.icon}>{a.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={common.name}>{a.name}</Text>
                  <Text style={common.sub}>Worth {fmt(a.value)}</Text>
                </View>
                <Chip text={`${gain >= 0 ? '+' : ''}${fmt(gain)}`} tone={gain >= 0 ? 'good' : 'bad'} />
              </View>
              <View style={common.wrap}>
                {a.kind === 'investment' && a.value >= 2 && (
                  <Button small variant="ghost" label="Sell half" disabled={guarded} onPress={() => act({ type: 'SELL', assetId: a.id, amount: Math.floor(a.value / 2) })} />
                )}
                <Button small variant="ghost" label={a.kind === 'investment' ? 'Sell all' : 'Sell'} disabled={guarded} onPress={() => act({ type: 'SELL', assetId: a.id })} />
              </View>
            </Card>
          </FadeIn>
        );
      })}

      {c.age < AGE_GATES.money && (
        <LockedCard icon="🛍️" title="Shop, property & investing" minAge={AGE_GATES.money} age={c.age} note={c.age < AGE_GATES.piggyBank ? 'Pocket money starts at 6' : 'Keep saving your pocket money'} />
      )}
      {c.age >= AGE_GATES.money && GROUPS.map((g) => {
        const items = gameContent.offers.filter((o) => o.kind === g.kind);
        if (items.length === 0) return null;
        return (
          <View key={g.kind} style={{ gap: 8 }}>
            <SectionHeader icon={g.icon} title={g.title} color={g.color} />
            {items.map((o) => (
              <FadeIn key={o.id}>
                <Card>
                  <View style={common.row}>
                    <Text style={common.icon}>{o.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={common.name}>{o.name}</Text>
                      <Text style={common.sub}>{o.blurb}</Text>
                    </View>
                  </View>
                  <View style={common.wrap}>
                    {o.divisible ? <Chip text={riskLabel(o.sd)} tone={o.sd < 0.2 ? 'good' : 'bad'} /> : <Chip text={`💵 ${fmt(o.price)}`} />}
                    {o.joy ? <Chip text={`😊 +${o.joy}/yr`} tone="good" /> : null}
                    {o.yield ? <Chip text={`📥 ${Math.round(o.yield * 100)}% income`} tone="good" /> : null}
                    <Chip text={`Age ${o.minAge}+`} />
                  </View>
                  {o.divisible ? (
                    <View style={common.wrap}>
                      {[100, 1000, 10000].map((n) => (
                        <Button key={n} small variant="ghost" label={fmt(n)} disabled={guarded || c.money < n || c.age < o.minAge} onPress={() => act({ type: 'INVEST', offerId: o.id, amount: n })} />
                      ))}
                      <Button small variant="ghost" label="Half of cash" disabled={guarded || c.money < 2 || c.age < o.minAge} onPress={() => act({ type: 'INVEST', offerId: o.id, amount: Math.floor(c.money / 2) })} />
                    </View>
                  ) : (
                    <BuyRow offer={o} game={game} act={act} guarded={guarded} />
                  )}
                  {o.divisible && c.age < o.minAge && <Text style={common.reason}>Needs age {o.minAge}+</Text>}
                </Card>
              </FadeIn>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

function BuyRow({ offer, game, act, guarded }: TabProps & { offer: AssetOffer }) {
  const c = game.character;
  const cashWhy = buyBlocker(c, offer, false);
  const creditWhy = offer.financeable ? buyBlocker(c, offer, true) : null;
  return (
    <View style={{ gap: 6 }}>
      <Button label={`Buy for ${fmt(offer.price)}`} variant="ghost" disabled={guarded || !!cashWhy} onPress={() => act({ type: 'BUY', offerId: offer.id })} />
      {cashWhy && <Text style={common.reason}>{cashWhy}</Text>}
      {offer.financeable && (
        <>
          <Button label={`Buy on credit (${fmt(offer.price * 0.2)} down)`} variant="ghost" disabled={guarded || !!creditWhy} onPress={() => act({ type: 'BUY', offerId: offer.id, financed: true })} />
          {creditWhy && <Text style={common.reason}>{creditWhy}</Text>}
        </>
      )}
    </View>
  );
}
