import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { useChatStore } from '../../store/useChatStore';
import { characters } from '../../data/characters';
import { scenarios } from '../../data/scenarios';
import { getCharacter } from '../../data/characters';
import { Avatar } from '../../components/common/Avatar';
import { Character, GroupScenario, Chat } from '../../types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export default function HomeScreen() {
  const router = useRouter();
  const userName = useUserStore((s) => s.name);
  const favoriteIds = useUserStore((s) => s.favoriteCharacters);
  const logout = useUserStore((s) => s.logout);
  const getOrCreateIndividualChat = useChatStore((s) => s.getOrCreateIndividualChat);
  const getSortedChats = useChatStore((s) => s.getSortedChats);
  const createChat = useChatStore((s) => s.createChat);
  const [activePersonality, setActivePersonality] = useState<{ id: string; source: 'hover' | 'longpress' } | null>(null);
  const [hoveredStoryId, setHoveredStoryId] = useState<string | null>(null);
  const [hoveredScenarioId, setHoveredScenarioId] = useState<string | null>(null);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [hoveredControl, setHoveredControl] = useState<'logout' | 'search' | 'add' | null>(null);

  const recentChats = getSortedChats();

  // Favorites first
  const sortedCharacters = [
    ...characters.filter((c) => favoriteIds.includes(c.id)),
    ...characters.filter((c) => !favoriteIds.includes(c.id)),
  ];

  const handleCharacterPress = (character: Character) => {
    const chat = getOrCreateIndividualChat(character.id);
    router.push(`/chat/${chat.id}`);
  };

  const handleChatPress = (chat: Chat) => {
    if (chat.type === 'group') {
      router.push(`/group/${chat.id}`);
    } else {
      router.push(`/chat/${chat.id}`);
    }
  };

  const handleScenarioPress = (scenario: GroupScenario) => {
    const chat: Chat = {
      id: `group_${scenario.id}_${Date.now()}`,
      type: 'group',
      characterIds: scenario.characterIds,
      title: scenario.name,
      scenarioId: scenario.id,
      mutedCharacters: [],
    };
    createChat(chat);
    router.push(`/group/${chat.id}`);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* WhatsApp-style header */}
      <View style={styles.header}>
        <Text style={styles.appName}>AI Adda</Text>
        <View style={styles.headerRight}>
          <Pressable
            style={({ pressed }) => [
              styles.headerBtn,
              hoveredControl === 'logout' && styles.headerBtnHover,
              pressed && styles.headerBtnPressed,
            ]}
            onPress={handleLogout}
            onHoverIn={() => setHoveredControl('logout')}
            onHoverOut={() => setHoveredControl(null)}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.headerBtn,
              hoveredControl === 'search' && styles.headerBtnHover,
              pressed && styles.headerBtnPressed,
            ]}
            onHoverIn={() => setHoveredControl('search')}
            onHoverOut={() => setHoveredControl(null)}
          >
            <Ionicons name="search" size={22} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.headerBtn,
              hoveredControl === 'add' && styles.headerBtnHover,
              pressed && styles.headerBtnPressed,
            ]}
            onPress={() => router.push('/group/create')}
            onHoverIn={() => setHoveredControl('add')}
            onHoverOut={() => setHoveredControl(null)}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stories-style character row */}
        <FlatList
          style={styles.storiesList}
          horizontal
          data={sortedCharacters}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesRow}
          renderItem={({ item }) => {
            const isFav = favoriteIds.includes(item.id);
            const isPersonalityVisible = activePersonality?.id === item.id;
            const personalityText = getPersonalitySummary(item);
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.storyItem,
                  hoveredStoryId === item.id && styles.storyItemHover,
                  pressed && styles.storyItemPressed,
                ]}
                onHoverIn={() => {
                  setHoveredStoryId(item.id);
                  setActivePersonality({ id: item.id, source: 'hover' });
                }}
                onHoverOut={() => {
                  setHoveredStoryId(null);
                  if (activePersonality?.id === item.id && activePersonality.source === 'hover') {
                    setActivePersonality(null);
                  }
                }}
                onLongPress={() => setActivePersonality({ id: item.id, source: 'longpress' })}
                delayLongPress={180}
                onPress={() => {
                  if (activePersonality?.id === item.id && activePersonality.source === 'longpress') {
                    setActivePersonality(null);
                    return;
                  }
                  setActivePersonality(null);
                  handleCharacterPress(item);
                }}
              >
                <View style={[styles.storyRing, { borderColor: item.avatarColor }]}>
                  <Avatar color={item.avatarColor} emoji={item.avatarEmoji} image={item.avatarImage} size={56} showOnline />
                </View>
                <Text style={styles.storyName} numberOfLines={1}>{item.name}</Text>
                {isFav && <Text style={styles.favDot}>♥</Text>}
                {isPersonalityVisible && (
                  <View style={styles.personalityPopover}>
                    <Text style={styles.personalityTitle}>{item.archetype}</Text>
                    <Text style={styles.personalityText} numberOfLines={2}>
                      {personalityText}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />

        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetTitle}>Hey {userName}! 👋</Text>
          <Text style={styles.greetSub}>Kisse baat karoge aaj?</Text>
        </View>

        {/* Group Scenes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Group Scenes 🎭</Text>
            <TouchableOpacity onPress={() => router.push('/group/create')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={scenarios}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scenarioList}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.scenarioCard,
                  hoveredScenarioId === item.id && styles.scenarioCardHover,
                  pressed && styles.scenarioCardPressed,
                ]}
                onPress={() => handleScenarioPress(item)}
                onHoverIn={() => setHoveredScenarioId(item.id)}
                onHoverOut={() => setHoveredScenarioId(null)}
              >
                <LinearGradient
                  colors={[colors.bgElevated, colors.bgCard]}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={styles.scenarioEmoji}>{item.emoji}</Text>
                <Text style={styles.scenarioName}>{item.name}</Text>
                <Text style={styles.scenarioDesc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.scenarioAvatars}>
                  {item.characterIds.slice(0, 3).map((cid) => {
                    const c = getCharacter(cid);
                    return c ? (
                      <View key={c.id} style={styles.scenarioAvatar}>
                        <Avatar color={c.avatarColor} emoji={c.avatarEmoji} image={c.avatarImage} size={24} />
                      </View>
                    ) : null;
                  })}
                </View>
              </Pressable>
            )}
          />
        </View>

        {/* Recent Chats */}
        {recentChats.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: spacing.xxl }]}>
              Recent Chats 💬
            </Text>
            {recentChats.slice(0, 8).map((chat) => {
              const char = getCharacter(chat.characterIds[0]);
              const isGroup = chat.type === 'group';
              return (
                <Pressable
                  key={chat.id}
                  style={({ pressed }) => [
                    styles.chatItem,
                    hoveredChatId === chat.id && styles.chatItemHover,
                    pressed && styles.chatItemPressed,
                  ]}
                  onPress={() => handleChatPress(chat)}
                  onHoverIn={() => setHoveredChatId(chat.id)}
                  onHoverOut={() => setHoveredChatId(null)}
                >
                  {char && !isGroup ? (
                    <Avatar color={char.avatarColor} emoji={char.avatarEmoji} image={char.avatarImage} size={50} showOnline />
                  ) : (
                    <View style={styles.groupAvatar}>
                      <Text style={{ fontSize: 22 }}>👥</Text>
                    </View>
                  )}
                  <View style={styles.chatInfo}>
                    <View style={styles.chatTop}>
                      <Text style={styles.chatName}>
                        {isGroup ? chat.title : char?.name || 'Chat'}
                      </Text>
                      <View style={styles.chatMetaRight}>
                        {chat.lastMessageTime && (
                          <Text style={styles.chatTime}>{formatTime(chat.lastMessageTime)}</Text>
                        )}
                        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                      </View>
                    </View>
                    <Text style={styles.chatPreview} numberOfLines={1}>
                      {chat.lastMessage || 'Tap to start chatting...'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/group/create')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.fabGradient}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getPersonalitySummary(character: Character): string {
  const traits: string[] = [];
  const p = character.personality;
  if (p.humor >= 7) traits.push('funny');
  if (p.warmth >= 8) traits.push('warm');
  if (p.sarcasm >= 7) traits.push('sarcastic');
  if (p.energy >= 8) traits.push('high-energy');
  if (p.wisdom >= 8) traits.push('wise');
  if (p.desiMeter >= 8) traits.push('desi');
  const traitSummary = traits.length > 0 ? traits.slice(0, 4).join(' • ') : 'balanced vibe';
  return `${character.tagline} • ${traitSummary}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerBtn: {
    padding: spacing.xs,
    borderRadius: 10,
  },
  headerBtnHover: {
    backgroundColor: colors.bgElevated,
  },
  headerBtnPressed: {
    backgroundColor: '#2A3942',
  },
  // Stories row
  storiesList: {
    overflow: 'visible',
  },
  storiesRow: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
    overflow: 'visible',
  },
  storyItem: {
    alignItems: 'center',
    width: 76,
    position: 'relative',
    borderRadius: 12,
    paddingVertical: 2,
    minHeight: 150,
  },
  storyItemHover: {
    backgroundColor: colors.bgElevated,
  },
  storyItemPressed: {
    opacity: 0.8,
  },
  storyRing: {
    borderWidth: 2.5,
    borderRadius: 33,
    padding: 2,
  },
  storyName: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  favDot: {
    color: '#FF6B6B',
    fontSize: 8,
    marginTop: 1,
  },
  personalityPopover: {
    position: 'absolute',
    top: 72,
    left: -28,
    width: 170,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 20,
  },
  personalityTitle: {
    ...typography.small,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  personalityText: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  // Greeting
  greeting: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  greetTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 24,
  },
  greetSub: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
  },
  // Section
  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 17,
  },
  seeAll: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  // Scenarios
  scenarioList: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  scenarioCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: 170,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  scenarioCardHover: {
    borderColor: colors.borderLight,
    transform: [{ translateY: -2 }],
    shadowOpacity: 0.2,
  },
  scenarioCardPressed: {
    transform: [{ translateY: 0 }],
    opacity: 0.95,
  },
  scenarioEmoji: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  scenarioName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 14,
  },
  scenarioDesc: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  scenarioAvatars: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: -6,
  },
  scenarioAvatar: {
    marginLeft: -4,
  },
  // Chat items (WhatsApp style)
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.bgCard,
    marginHorizontal: spacing.lg,
    borderRadius: 14,
    marginBottom: spacing.xs,
  },
  chatItemHover: {
    borderColor: colors.borderLight,
    backgroundColor: colors.bgElevated,
  },
  chatItemPressed: {
    opacity: 0.92,
  },
  chatInfo: {
    flex: 1,
    marginLeft: spacing.md,
    paddingBottom: spacing.xs,
  },
  chatTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  chatName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 16,
  },
  chatTime: {
    ...typography.small,
    color: colors.textMuted,
  },
  chatPreview: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 3,
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: spacing.xxl,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
