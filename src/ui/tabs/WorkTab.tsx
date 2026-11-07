import { ScrollView, Text, View } from 'react-native';
import { gameContent } from '@content/index';
import {
  careerBlocker,
  careerById,
  EDUCATION_NAMES,
  hireChance,
  promotionBlocker,
  studyBlocker,
} from '@engine/index';
import { useSettings } from '@store/useSettings';
import { Button, Card, Chip, Title } from '../components/kit';
import { colors } from '../theme/tokens';
import { Banner, common, FadeIn, fmt, Meter, pageStyle, SectionHeader, TabProps } from './shared';

const oddsLabel = (p: number): string => (p < 0.25 ? 'Long shot' : p < 0.45 ? 'Possible' : p < 0.65 ? 'Good odds' : 'Likely');
const KIND_LABEL = { primary: 'Primary school', secondary: 'High school', university: 'University', masters: "Master's", doctorate: 'Doctorate' } as const;

export default function WorkTab({ game, act, guarded }: TabProps) {
  const c = game.character;
  const { hardcore } = useSettings();
  const noTime = game.yearLoop.actionsLeft === 0;
  const job = c.job;
  const career = job ? careerById(gameContent, job.careerId) : undefined;
  const promoWhy = promotionBlocker(c, gameContent);
  const edu = c.education;

  const rows = gameContent.careers
    .map((k) => ({ k, why: careerBlocker(c, k, gameContent) }))
    .sort((a, b) => Number(!!a.why) - Number(!!b.why));
  const sectors = [...new Set(rows.map((r) => r.k.sector))];

  return (
    <ScrollView contentContainerStyle={pageStyle}>
      {noTime && <Banner tone="warn" text="⏳ No time left this year. Age up to get more slots (money moves and quitting are free)." />}

      <SectionHeader icon="💼" title="Your job" color="#5DA9FF" />
      <Card>
        {job ? (
          <>
            <View style={common.row}>
              <Text style={common.icon}>{career?.icon ?? '💼'}</Text>
              <View style={{ flex: 1 }}>
                <Title>{job.title}</Title>
                <Text style={common.sub}>
                  {fmt(job.salary)}/yr · {job.yearsInJob} yr in role
                </Text>
              </View>
            </View>
            {career && (
              <View style={common.wrap}>
                {career.ladder.map((r, i) => (
                  <Chip key={r.title} text={`${i <= job.level ? '✅' : '🔒'} ${r.title}`} tone={i === job.level ? 'good' : 'neutral'} />
                ))}
              </View>
            )}
            <Meter value={job.performance} color="#4ADE80" label="Performance (put Focus into Work to raise it)" />
            <View style={common.wrap}>
              <Button small label="💵 Ask for raise" variant="ghost" disabled={guarded || noTime} onPress={() => act({ type: 'ASK_RAISE' })} />
              <Button small label="📈 Seek promotion" variant="ghost" disabled={guarded || noTime || !!promoWhy} onPress={() => act({ type: 'SEEK_PROMOTION' })} />
              <Button small label="🚪 Quit" variant="ghost" disabled={guarded} onPress={() => act({ type: 'QUIT_JOB' })} />
              {c.age >= 60 && <Button small label="🏖️ Retire" variant="ghost" disabled={guarded} onPress={() => act({ type: 'RETIRE' })} />}
            </View>
            {promoWhy && <Text style={common.sub}>Promotion: {promoWhy}</Text>}
          </>
        ) : c.retired ? (
          <>
            <Title>🏖️ Retired</Title>
            <Text style={common.sub}>Pension: {fmt(Number(c.flags.pension ?? 12000))} a year. Enjoy it.</Text>
          </>
        ) : (
          <>
            <Title>No job right now</Title>
            <Text style={common.sub}>Browse the job board below and apply.</Text>
          </>
        )}
      </Card>

      <SectionHeader icon="🎓" title="School" color="#C58BFF" />
      <Card>
        <Title>{EDUCATION_NAMES[edu.level]}</Title>
        {edu.enrolled ? (
          <Text style={common.sub}>
            Enrolled: {KIND_LABEL[edu.enrolled.kind]}
            {edu.enrolled.major ? ` (${edu.enrolled.major})` : ''} · {edu.enrolled.yearsLeft} yr left
          </Text>
        ) : (
          <Text style={common.sub}>Not currently studying.</Text>
        )}
        {(edu.enrolled || edu.level > 0) && <Meter value={edu.grades} color="#5DA9FF" label="Grades (Study focus raises them)" />}
        {edu.degrees.length > 0 && (
          <View style={common.wrap}>
            {edu.degrees.map((d) => (
              <Chip key={d} text={`🎓 ${d}`} tone="good" />
            ))}
          </View>
        )}
        {(['university', 'masters', 'doctorate'] as const).map((kind) => {
          const why = studyBlocker(c, kind);
          const label = kind === 'university' ? 'Apply to university' : kind === 'masters' ? "Apply for Master's" : 'Apply for Doctorate';
          return (
            <View key={kind} style={{ gap: 2 }}>
              <Button label={label} variant="ghost" disabled={guarded || noTime || !!why} onPress={() => act({ type: 'APPLY_STUDY', kind })} />
              {why && <Text style={common.sub}>{why}</Text>}
            </View>
          );
        })}
        {edu.enrolled && edu.enrolled.kind !== 'primary' && edu.enrolled.kind !== 'secondary' && (
          <Button label="🚪 Drop out" variant="ghost" disabled={guarded} onPress={() => act({ type: 'DROP_OUT' })} />
        )}
      </Card>

      <SectionHeader icon="📋" title="Job board" color={colors.accent} />
      {sectors.map((sector) => (
        <View key={sector} style={{ gap: 8 }}>
          <Text style={[common.sub, { letterSpacing: 1, textTransform: 'uppercase' }]}>{sector}</Text>
          {rows
            .filter((r) => r.k.sector === sector)
            .map(({ k, why }) => {
              const top = k.ladder[k.ladder.length - 1]?.salary ?? 0;
              return (
                <FadeIn key={k.id}>
                  <Card style={why ? { opacity: 0.75 } : undefined}>
                    <View style={common.row}>
                      <Text style={common.icon}>{k.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={common.name}>{k.name}</Text>
                        <Text style={common.sub}>{k.blurb}</Text>
                      </View>
                    </View>
                    <View style={common.wrap}>
                      <Chip text={`💵 ${fmt(k.ladder[0]?.salary ?? 0)} → ${fmt(top)}`} tone="good" />
                      <Chip text={`Age ${k.minAge}+`} />
                      {k.minEdu > 0 && <Chip text={`🎓 ${EDUCATION_NAMES[k.minEdu]}`} />}
                      {!hardcore && !why && <Chip text={oddsLabel(hireChance(c, k))} />}
                    </View>
                    {why && <Text style={common.reason}>{why}</Text>}
                    <Button label={`Apply: ${k.ladder[0]?.title ?? k.name}`} variant="ghost" disabled={guarded || noTime || !!why} onPress={() => act({ type: 'APPLY_JOB', careerId: k.id })} />
                  </Card>
                </FadeIn>
              );
            })}
        </View>
      ))}
    </ScrollView>
  );
}
