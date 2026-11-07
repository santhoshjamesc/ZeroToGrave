import { useCallback, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameState } from '@engine/index';
import GameScreen from '@ui/screens/GameScreen';
import NewLifeScreen from '@ui/screens/NewLifeScreen';
import AchievementsScreen from '@ui/screens/AchievementsScreen';
import GraveyardScreen from '@ui/screens/GraveyardScreen';
import SettingsScreen from '@ui/screens/SettingsScreen';
import SlotsScreen from '@ui/screens/SlotsScreen';
import StartScreen from '@ui/screens/StartScreen';
import { colors } from '@ui/theme/tokens';
import { beginLife, recordProgress } from '@store/meta';
import { firstEmptySlot, latestSlot, listSlots, loadSlot, saveSlot } from '@store/saves';

type Screen =
  'start' | 'newLife' | 'game' | 'slots' | 'pickSlot' | 'achievements' | 'graveyard' | 'settings';

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [game, setGame] = useState<GameState | null>(null);
  const [lifeNo, setLifeNo] = useState(0);
  // Bumped whenever saves may have changed so the start screen re-reads them.
  const [saveRev, setSaveRev] = useState(0);
  const slotRef = useRef<number | null>(null);
  const pending = useRef<GameState | null>(null);

  const play = useCallback((g: GameState, slot: number) => {
    slotRef.current = slot;
    saveSlot(slot, g);
    recordProgress(g);
    setGame(g);
    setLifeNo((n) => n + 1);
    setScreen('game');
  }, []);

  const onChange = useCallback((g: GameState) => {
    if (slotRef.current !== null) saveSlot(slotRef.current, g);
    recordProgress(g);
  }, []);

  const startNewLife = (g: GameState) => {
    beginLife();
    const slot = firstEmptySlot();
    if (slot === null) {
      pending.current = g;
      setScreen('pickSlot');
    } else {
      play(g, slot);
    }
  };

  const loadAndPlay = (slotId: number) => {
    const r = loadSlot(slotId);
    if (r.ok) play(r.state, slotId);
    else Alert.alert('Could not load', r.error);
  };

  const home = () => {
    setSaveRev((n) => n + 1);
    setScreen('start');
  };

  // `saveRev` is read so the Continue card refreshes after returning from a game.
  const slots = screen === 'start' ? (void saveRev, listSlots()) : [];
  const latest = screen === 'start' ? latestSlot() : null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {screen === 'start' && (
          <StartScreen
            latest={latest}
            hasSaves={slots.some((s) => !s.empty)}
            onContinue={() => latest && loadAndPlay(latest.slotId)}
            onNewLife={() => setScreen('newLife')}
            onLoad={() => setScreen('slots')}
            onAchievements={() => setScreen('achievements')}
            onGraveyard={() => setScreen('graveyard')}
            onSettings={() => setScreen('settings')}
          />
        )}
        {screen === 'newLife' && <NewLifeScreen onStart={startNewLife} onBack={home} />}
        {screen === 'slots' && (
          <SlotsScreen mode="load" onBack={home} onLoad={loadAndPlay} onPick={() => undefined} />
        )}
        {screen === 'pickSlot' && (
          <SlotsScreen
            mode="pick"
            onBack={home}
            onLoad={() => undefined}
            onPick={(slot) => {
              const g = pending.current;
              pending.current = null;
              if (g) play(g, slot);
            }}
          />
        )}
        {screen === 'achievements' && <AchievementsScreen onBack={home} />}
        {screen === 'graveyard' && <GraveyardScreen onBack={home} />}
        {screen === 'settings' && (
          <SettingsScreen onBack={home} onWiped={() => setSaveRev((n) => n + 1)} />
        )}
        {screen === 'game' && game && (
          <GameScreen
            key={lifeNo}
            initial={game}
            onChange={onChange}
            onExit={home}
            onNewLife={() => setScreen('newLife')}
            onHeir={(g) => {
              if (slotRef.current !== null) play(g, slotRef.current);
            }}
          />
        )}
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
  );
}
