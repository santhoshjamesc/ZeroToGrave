import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PendingEvent } from '@engine/index';
import { useSettings } from '@store/useSettings';
import { warnHaptic } from '../feedback';
import { colors, radius, spacing } from '../theme/tokens';
import { Button } from './kit';

const GUARD_MS = 500;

/** A popup decision created by an action (date, job offer, court case…). Blocks everything else. */
export function PromptModal({ prompt, onChoose }: { prompt: PendingEvent | null; onChoose: (choiceId: string) => void }) {
  const { hardcore } = useSettings();
  const [guarded, setGuarded] = useState(true);
  const pop = useRef(new Animated.Value(0)).current;
  const id = prompt?.eventId;

  useEffect(() => {
    if (!id) return;
    setGuarded(true);
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }).start();
    const t = setTimeout(() => setGuarded(false), GUARD_MS);
    return () => clearTimeout(t);
  }, [id, pop]);

  if (!prompt) return null;
  const { def } = prompt;
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });
  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => undefined}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity: pop, transform: [{ scale }] }]}>
          <Text style={styles.kicker}>DECISION</Text>
          <Text style={styles.title}>{def.title}</Text>
          <ScrollView style={{ maxHeight: 130 }}>
            <Text style={styles.body}>{def.text}</Text>
          </ScrollView>
          <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ gap: spacing.sm }}>
            {def.choices.map((ch) => {
              const hint = hardcore ? '' : ch.riskHint === 'risky' ? '  🔥' : ch.riskHint === 'gamble' ? '  🎲' : '';
              return (
                <Button
                  key={ch.id}
                  variant="ghost"
                  disabled={guarded}
                  label={`${ch.label}${hint}`}
                  onPress={() => {
                    if (ch.riskHint === 'gamble' || ch.riskHint === 'risky') warnHaptic();
                    onChoose(ch.id);
                  }}
                />
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000B', justifyContent: 'center', padding: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, borderWidth: 2, borderColor: colors.accent },
  kicker: { color: colors.accent, fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  body: { color: colors.text, fontSize: 16, lineHeight: 22 },
});
