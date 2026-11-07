import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/kit';
import { colors, spacing } from '../theme/tokens';

/** Shared chrome for menu screens: safe area, back button, title, scrolling body. */
export default function ScreenFrame(p: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.head}>
        <Button small variant="ghost" label="‹ Back" onPress={p.onBack} />
        <Text style={styles.title} accessibilityRole="header">
          {p.title}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>{p.children}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  body: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
});
