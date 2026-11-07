import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gameContent } from '@content/index';
import {
  avatarSpec,
  Cue,
  cueFromChange,
  GameAction,
  GameState,
  lifeStage,
  MIN_AGING_MS,
  reduceGame,
  startHeir,
} from '@engine/index';
import { playSfx } from '../audio';
import { Avatar } from '../components/Avatar';
import { PromptModal } from '../components/PromptModal';
import { Scene } from '../components/Scene';
import { Toast, ToastMsg } from '../components/Toast';
import { Tombstone } from '../components/Tombstone';
import YearPanel from '../components/YearPanel';
import ActivitiesTab from '../tabs/ActivitiesTab';
import MeTab from '../tabs/MeTab';
import MoneyTab from '../tabs/MoneyTab';
import PeopleTab from '../tabs/PeopleTab';
import WorkTab from '../tabs/WorkTab';
import { colors, radius, spacing } from '../theme/tokens';

type Tab = 'life' | 'do' | 'work' | 'money' | 'people' | 'me';
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'life', icon: '🏠', label: 'Life' },
  { id: 'do', icon: '🎯', label: 'Do' },
  { id: 'work', icon: '💼', label: 'Work' },
  { id: 'money', icon: '💰', label: 'Money' },
  { id: 'people', icon: '👪', label: 'People' },
  { id: 'me', icon: '🧍', label: 'Me' },
];

const INPUT_GUARD_MS = 400;

const money = (n: number): string => `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;

export interface GameScreenProps {
  initial: GameState;
  /** Called after every state change (autosave hook). */
  onChange: (g: GameState) => void;
  onExit: () => void;
  onNewLife: () => void;
  onHeir: (g: GameState) => void;
}

/** UI only dispatches engine actions (`reduceGame`); every gate lives in the engine. */
export default function GameScreen({ initial, onChange, onExit, onNewLife, onHeir }: GameScreenProps) {
  const [game, setGame] = useState<GameState>(initial);
  const gameRef = useRef(game);
  const [tab, setTab] = useState<Tab>('life');
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const toastId = useRef(0);
  const [cue, setCue] = useState<{ id: number; kind: Cue } | null>(null);
  const cueId = useRef(0);
  const { character: c, yearLoop: loop } = game;
  const spec = useMemo(() => avatarSpec(c), [c]);

  const say = useCallback((icon: string, text: string, tone: ToastMsg['tone'] = 'info') => {
    toastId.current += 1;
    setToast({ id: toastId.current, icon, text, tone });
  }, []);

  /** The single dispatch point: runs the engine, shows what happened, plays sound. */
  const act = useCallback(
    (action: GameAction) => {
      const before = gameRef.current;
      const r = reduceGame(before, action, gameContent);
      if (!r.ok) {
        if (action.type !== 'FINISH_AGING') {
          say('✋', r.error, 'bad');
          playSfx('bad');
        }
        return;
      }
      const next = r.state;
      gameRef.current = next;
      setGame(next);
      const kind = cueFromChange(before.character, next.character);
      if (kind) {
        cueId.current += 1;
        setCue({ id: cueId.current, kind });
      }
      const fresh = next.character.log.slice(before.character.log.length);
      const last = fresh[fresh.length - 1];
      if (action.type !== 'FINISH_AGING' && last) {
        say(last.icon, last.text, last.icon === '🏆' ? 'win' : 'info');
      }
      if (next.achievements.length > before.achievements.length) playSfx('achievement');
      else if (next.character.money - before.character.money >= 500 && action.type !== 'FINISH_AGING') {
        playSfx('coin');
      }
      if (next.yearLoop.phase === 'DEAD' && before.yearLoop.phase !== 'DEAD') playSfx('death');
      if (action.type === 'CONFIRM_AGE_UP') playSfx('age');
    },
    [say],
  );

  useEffect(() => {
    onChange(game);
  }, [game, onChange]);

  // Input guard after each new card appears, to defeat spam-tapping (see ztg-anti-rush-pacing).
  const [guarded, setGuarded] = useState(false);
  const resolvedCount = loop.pendingEvents.filter((e) => e.resolvedChoiceId).length;
  useEffect(() => {
    setGuarded(true);
    const t = setTimeout(() => setGuarded(false), INPUT_GUARD_MS);
    return () => clearTimeout(t);
  }, [loop.phase, loop.year, resolvedCount, tab]);

  // AGING: wait out the minimum duration, then ask the engine to finish.
  const startRef = useRef(0);
  useEffect(() => {
    if (loop.phase !== 'AGING') return;
    const t = setTimeout(
      () => act({ type: 'FINISH_AGING', now: startRef.current + MIN_AGING_MS }),
      MIN_AGING_MS,
    );
    return () => clearTimeout(t);
  }, [loop.phase, act]);

  const heir = (childId: string) => {
    const next = startHeir(gameRef.current, childId);
    if (next) onHeir(next);
  };

  const dead = loop.phase === 'DEAD';
  const stage = lifeStage(dead ? Math.max(0, c.age - 1) : c.age);
  const prison = c.crime.prison;
  const subline = prison
    ? `⛓️ In prison · ${prison.yearsLeft} yr left`
    : c.job
      ? `💼 ${c.job.title}`
      : c.education.enrolled
        ? `🏫 ${c.education.enrolled.kind === 'primary' ? 'Primary school' : c.education.enrolled.kind === 'secondary' ? 'High school' : 'University'}`
        : `${c.identity.flag} ${c.identity.city}`;
  const tabProps = { game, act, guarded };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Toast msg={toast} />
      <PromptModal prompt={game.prompt} onChoose={(choiceId) => act({ type: 'RESOLVE_PROMPT', choiceId })} />

      {!dead && (
        <View style={styles.slotsBar} accessibilityLabel={`${loop.actionsLeft} of 4 actions left this year`}>
          <Text style={styles.slotsText}>⏳ Time this year</Text>
          <View style={styles.pips}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={[styles.pip, i < loop.actionsLeft && styles.pipOn]} />
            ))}
          </View>
          <Text style={styles.slotsAge}>Age {c.age}</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        {tab === 'life' && (
          <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
            <View style={styles.hero}>
              <Scene stage={stage} height={400} />
              <View style={styles.hud}>
                <View>
                  <Text style={styles.heroName}>{c.name}</Text>
                  <Text style={styles.heroSub}>{subline}</Text>
                </View>
                <View style={styles.ageBadge} accessibilityLabel={`Age ${c.age}`}>
                  <Text style={styles.ageNum}>{dead ? c.age - 1 : c.age}</Text>
                  <Text style={styles.ageLbl}>{dead ? 'DIED' : 'AGE'}</Text>
                </View>
              </View>
              <View style={styles.avatarWrap}>
                {dead ? (
                  <Tombstone name={c.name} years={`${c.identity.birthYear} – ${c.identity.birthYear + c.age - 1}`} size={220} />
                ) : (
                  <Avatar spec={spec} size={210} cue={cue} />
                )}
              </View>
              <View style={styles.moneyPill}>
                <Text style={styles.moneyText}>💰 {money(c.money)}</Text>
              </View>
            </View>
            <View style={styles.panel}>
              <YearPanel
                game={game}
                c={c}
                loop={loop}
                guarded={guarded}
                dispatch={act}
                onAgeUp={() => {
                  startRef.current = Date.now();
                  act({ type: 'CONFIRM_AGE_UP', now: startRef.current });
                }}
                onNewLife={onNewLife}
                onExit={onExit}
                onHeir={heir}
              />
            </View>
          </ScrollView>
        )}
        {tab === 'do' && <ActivitiesTab {...tabProps} />}
        {tab === 'work' && <WorkTab {...tabProps} />}
        {tab === 'money' && <MoneyTab {...tabProps} />}
        {tab === 'people' && <PeopleTab {...tabProps} />}
        {tab === 'me' && <MeTab {...tabProps} />}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.id }}
            accessibilityLabel={t.label}
            onPress={() => setTab(t.id)}
            style={styles.tab}
          >
            <Text style={{ fontSize: 21 }}>{t.icon}</Text>
            <Text style={[styles.tabLbl, tab === t.id && { color: colors.accent }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  slotsBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  slotsText: { color: colors.muted, fontWeight: '800', fontSize: 12, flex: 1 },
  slotsAge: { color: colors.accent, fontWeight: '900', fontSize: 12 },
  pips: { flexDirection: 'row', gap: 5 },
  pip: { width: 18, height: 8, borderRadius: 4, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  pipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  hero: { height: 400, alignItems: 'center', overflow: 'hidden' },
  hud: { position: 'absolute', top: 8, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroName: { color: '#fff', fontSize: 22, fontWeight: '900', textShadowColor: '#0008', textShadowRadius: 6 },
  heroSub: { color: '#fff', fontWeight: '700', textShadowColor: '#0008', textShadowRadius: 6 },
  ageBadge: { backgroundColor: colors.bg, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 6, alignItems: 'center', borderWidth: 2, borderColor: colors.accent },
  ageNum: { color: colors.accent, fontSize: 28, fontWeight: '900', lineHeight: 30 },
  ageLbl: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  avatarWrap: { position: 'absolute', bottom: 22 },
  moneyPill: { position: 'absolute', bottom: 8, right: 14, backgroundColor: '#000A', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4 },
  moneyText: { color: '#fff', fontWeight: '800' },
  panel: { padding: spacing.md, marginTop: -8 },
  tabBar: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: 18, paddingTop: 6 },
  tab: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 4 },
  tabLbl: { color: colors.muted, fontSize: 10, fontWeight: '800' },
});
