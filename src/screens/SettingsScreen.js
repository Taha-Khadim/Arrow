import React from 'react';
import {
  View, Text, StyleSheet, Pressable, Switch, Alert, ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useGame } from '../context/GameContext';
import { tapHaptic } from '../utils/haptics';
import { Ionicons } from '@expo/vector-icons';

function SettingRow({ icon, label, value, onToggle, colors, delay = 0 }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={[styles.settingRow, { backgroundColor: colors.surface }]}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={22} color={colors.accent} />
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.surfaceSecondary, true: colors.accent + '60' }}
        thumbColor={value ? colors.accent : colors.textTertiary}
      />
    </Animated.View>
  );
}

function ThemeSelector({ colors, themeMode, setTheme, delay = 0 }) {
  const options = [
    { key: 'light', label: 'Light', icon: 'sunny-outline' },
    { key: 'dark', label: 'Dark', icon: 'moon-outline' },
    { key: 'amoled', label: 'AMOLED', icon: 'contrast-outline' },
  ];

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={[styles.settingRow, { backgroundColor: colors.surface, flexDirection: 'column', gap: 12 }]}
    >
      <View style={styles.settingLeft}>
        <Ionicons name="color-palette-outline" size={22} color={colors.accent} />
        <Text style={[styles.settingLabel, { color: colors.text }]}>Theme</Text>
      </View>
      <View style={styles.themeRow}>
        {options.map(opt => {
          const active = themeMode === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => { tapHaptic(); setTheme(opt.key); }}
              style={[
                styles.themeBtn,
                {
                  backgroundColor: active ? colors.accent : colors.surfaceSecondary,
                  borderColor: active ? colors.accent : colors.border,
                },
              ]}
            >
              <Ionicons name={opt.icon} size={16} color={active ? '#FFF' : colors.textSecondary} />
              <Text style={[styles.themeBtnText, { color: active ? '#FFF' : colors.textSecondary }]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

export default function SettingsScreen({ navigation }) {
  const { colors, themeMode, setTheme } = useTheme();
  const { soundEnabled, hapticEnabled, toggleSound, toggleHaptic, resetProgress, completedLevels, totalStars } = useGame();

  const handleReset = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure? This will erase all your progress and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => { tapHaptic(); resetProgress(); },
        },
      ]
    );
  };

  const completedCount = Object.keys(completedLevels).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PREFERENCES</Text>
        <ThemeSelector colors={colors} themeMode={themeMode} setTheme={setTheme} delay={100} />
        <SettingRow
          icon="volume-high-outline"
          label="Sound Effects"
          value={soundEnabled}
          onToggle={toggleSound}
          colors={colors}
          delay={150}
        />
        <SettingRow
          icon="phone-portrait-outline"
          label="Haptic Feedback"
          value={hapticEnabled}
          onToggle={toggleHaptic}
          colors={colors}
          delay={200}
        />

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 28 }]}>
          STATISTICS
        </Text>
        <Animated.View
          entering={FadeInDown.delay(250).springify()}
          style={[styles.statsCard, { backgroundColor: colors.surface }]}
        >
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Levels Completed</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{completedCount}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Stars</Text>
            <Text style={[styles.statValue, { color: colors.starFull }]}>⭐ {totalStars}</Text>
          </View>
        </Animated.View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 28 }]}>
          DATA
        </Text>
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Pressable
            onPress={handleReset}
            style={[styles.resetBtn, { backgroundColor: colors.surface, borderColor: colors.accent }]}
          >
            <Ionicons name="trash-outline" size={20} color={colors.accent} />
            <Text style={[styles.resetText, { color: colors.accent }]}>Reset All Progress</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>Arrow v1.1.0</Text>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>Made with ❤️</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 16, fontWeight: '500' },
  themeRow: { flexDirection: 'row', gap: 8, width: '100%' },
  themeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, gap: 6, borderWidth: 1,
  },
  themeBtnText: { fontSize: 13, fontWeight: '600' },
  statsCard: {
    borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8,
  },
  statLabel: { fontSize: 14, fontWeight: '500' },
  statValue: { fontSize: 16, fontWeight: '700' },
  divider: { height: 1, marginVertical: 4 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 14, gap: 8, borderWidth: 1.5,
  },
  resetText: { fontSize: 16, fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: 40, gap: 4 },
  footerText: { fontSize: 12 },
});
