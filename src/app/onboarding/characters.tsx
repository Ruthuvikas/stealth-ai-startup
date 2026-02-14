import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../store/useUserStore';
import { characters } from '../../data/characters';
import { Avatar } from '../../components/common/Avatar';
import { GradientButton } from '../../components/common/GradientButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export default function CharacterSelectionScreen() {
  const router = useRouter();
  const setFavoriteCharacters = useUserStore((s) => s.setFavoriteCharacters);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const [selected, setSelected] = useState<string[]>([]);

  const toggleCharacter = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleGetStarted = () => {
    setFavoriteCharacters(selected);
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const isValid = selected.length >= 2;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pick your squad 🎯</Text>
        <Text style={styles.subtitle}>Choose 2-3 characters you vibe with</Text>
      </View>

      <FlatList
        data={characters}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selected.includes(item.id);
          return (
            <TouchableOpacity
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => toggleCharacter(item.id)}
              activeOpacity={0.7}
            >
              {isSelected && (
                <LinearGradient
                  colors={[colors.primary + '20', 'transparent']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
              )}
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Text style={styles.check}>✓</Text>
                </View>
              )}
              <Avatar color={item.avatarColor} emoji={item.avatarEmoji} image={item.avatarImage} size={56} showOnline />
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.archBadge}>
                <Text style={styles.archetype}>{item.archetype}</Text>
              </View>
              <Text style={styles.city}>{item.city}</Text>
              <Text style={styles.tagline} numberOfLines={2}>{item.tagline}</Text>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={<View style={{ height: 120 }} />}
      />

      <LinearGradient
        colors={['transparent', colors.bg, colors.bg]}
        style={styles.footer}
        pointerEvents="box-none"
      >
        <GradientButton
          title={`Start Chatting! (${selected.length}/3) 💬`}
          onPress={handleGetStarted}
          disabled={!isValid}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 28,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '48%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: colors.primary,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  check: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  name: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    fontSize: 16,
  },
  archBadge: {
    backgroundColor: colors.primary + '18',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 4,
  },
  archetype: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  city: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 4,
  },
  tagline: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontSize: 11,
    lineHeight: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xxl,
    paddingBottom: 40,
    paddingTop: 40,
  },
});
