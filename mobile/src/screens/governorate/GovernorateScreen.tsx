import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { governoratesApi } from '../../api/governorates';
import { useGovernorateStore } from '../../store/governorateStore';
import SearchBar from '../../components/SearchBar';
import Header from '../../components/Header';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, typography } from '../../theme';
import { Governorate, MainStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Governorate'>;

// Distinct per-item colors cycling through a palette
const ICON_COLORS = [
  '#E53935', // Red
  '#1E88E5', // Blue
  '#00897B', // Teal
  '#43A047', // Green
  '#8E24AA', // Purple
  '#FB8C00', // Orange
  '#E91E63', // Pink
  '#00ACC1', // Cyan
];

// Custom Animated Radio Indicator
function RadioIndicator({ isActive }: { isActive: boolean }) {
  const scale = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1 : 0, { damping: 15 });
  }, [isActive]);

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  return (
    <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
      <Animated.View style={[styles.radioInner, innerStyle]} />
    </View>
  );
}

// Custom Animated Checkmark for Active State
function SelectedCheck({ isActive }: { isActive: boolean }) {
  const scale = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1 : 0, { damping: 12 });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  return (
    <Animated.View style={[styles.checkContainer, animatedStyle]}>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M20 6L9 17l-5-5" />
      </Svg>
    </Animated.View>
  );
}

export default function GovernorateScreen() {
  const navigation = useNavigation<Nav>();
  const { selected, setSelected } = useGovernorateStore();
  const { theme, isDark, toggleTheme } = useTheme();

  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [filtered, setFiltered] = useState<Governorate[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const data = await governoratesApi.getAll();
      setGovernorates(data);
      setFiltered(data);
    } catch {
      setError('Could not load governorates. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(governorates);
    } else {
      const q = search.toLowerCase();
      setFiltered(governorates.filter((g) => g.name.toLowerCase().includes(q)));
    }
  }, [search, governorates]);

  const handleContinue = () => {
    if (!selected) return;
    navigation.navigate('Hospitals', {
      governorateId: selected.id,
      governorateName: selected.name,
    });
  };

  const renderItem = ({ item, index }: { item: Governorate; index: number }) => {
    const isActive = selected?.id === item.id;
    const iconColor = ICON_COLORS[index % ICON_COLORS.length];
    return (
      <Animated.View entering={FadeInDown.delay(index * 35).duration(350)}>
        <TouchableOpacity
          style={[
            styles.govCard,
            { backgroundColor: theme.govCardBg },
            isActive && {
              backgroundColor: theme.govCardActiveBg,
              borderColor: theme.govCardActiveBorder,
            },
          ]}
          onPress={() => setSelected(item)}
          activeOpacity={0.85}
        >
          {/* Colored circular icon */}
          <View style={[styles.iconCircle, { backgroundColor: `${iconColor}22`, borderColor: `${iconColor}44` }]}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={isActive ? '#E53935' : iconColor} strokeWidth={2.5}>
              <Path d="M3 21h18" />
              <Path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
              <Path d="M9 21v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" />
              <Path d="M10 10h4" />
              <Path d="M12 8v4" />
            </Svg>
          </View>

          {/* Governorate Name */}
          <Text style={[
            styles.govName,
            { color: isActive ? theme.text : theme.govNameColor },
            isActive && { fontWeight: '700' },
          ]}>
            {item.name}
          </Text>

          {/* Selection indicator & check animation */}
          <View style={styles.selectionRow}>
            <SelectedCheck isActive={isActive} />
            <RadioIndicator isActive={isActive} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <Header
          title="Select Governorate"
          subtitle="Choose your region to find nearby hospitals"
          onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
          showProfileShortcut={false}
        />

        {/* Dark Mode Toggle — top-right overlay */}
        <TouchableOpacity
          style={[
            styles.themeToggle,
            {
              backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
              borderColor: isDark ? 'rgba(255,255,255,0.10)' : '#E0E0E0',
            },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={14}
            color={isDark ? '#FFFFFF' : '#555555'}
          />
          <Text style={[styles.themeText, { color: isDark ? '#A5A9B8' : '#555555' }]}>
            {isDark ? 'Dark' : 'Light'}
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            thumbColor="#fff"
            trackColor={{ false: '#D9D9D9', true: '#E53935' }}
            style={styles.themeSwitch}
          />
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchWrap}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search governorates…"
          />
        </View>

        {/* List Content */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={[styles.errorText, { color: theme.textSecondary }]}>{error}</Text>
            <TouchableOpacity
              onPress={() => load()}
              style={[styles.retryBtn, { backgroundColor: theme.retryBtnBg, borderColor: theme.primary }]}
            >
              <Text style={[styles.retryText, { color: theme.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => load(true)}
                tintColor={theme.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Sticky Continue Button Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleContinue}
            style={[
              styles.continueBtn,
              !selected && [
                styles.continueBtnDisabled,
                {
                  backgroundColor: theme.continueBtnDisabledBg,
                  borderColor: theme.continueBtnDisabledBorder,
                },
              ],
            ]}
            activeOpacity={selected ? 0.82 : 1}
            disabled={!selected}
          >
            <Text style={[
              styles.continueBtnText,
              !selected && { color: theme.textMuted },
            ]}>
              {selected ? 'Continue →' : 'Select a Governorate'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  // ── Dark Mode Toggle Pill (absolute top-right) ──
  themeToggle: {
    position: 'absolute',
    top: 18,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 5,
    paddingLeft: 8,
    paddingRight: 2,
    borderWidth: 1,
    gap: 4,
  },
  themeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  themeSwitch: {
    transform: [{ scaleX: 0.72 }, { scaleY: 0.72 }],
  },
  searchWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 140,
  },
  govCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
  },
  govName: {
    ...typography.bodyLg,
    fontWeight: '500',
    flex: 1,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#62667A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  radioOuterActive: {
    borderColor: '#E53935',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E53935',
  },
  checkContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: {
    ...typography.bodyMd,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryBtn: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderWidth: 1,
  },
  retryText: { ...typography.label },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: spacing.xl,
    right: spacing.xl,
  },
  continueBtn: {
    height: 54,
    borderRadius: radius.full,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    borderWidth: 1.5,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
