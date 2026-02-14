import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
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
  const getOrCreateIndividualChat = useChatStore((s) => s.getOrCreateIndividualChat);
  const getSortedChats = useChatStore((s) => s.getSortedChats);
  const createChat = useChatStore((s) => s.createChat);

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* WhatsApp-style header */}
      <View style={styles.header}>
        <Text style={styles.appName}>Adda</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="search" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/group/create')}>
            <Ionicons name="add-circle-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stories-style character row */}
        <FlatList
          horizontal
          data={sortedCharacters}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesRow}
          renderItem={({ item }) => {
            const isFav = favoriteIds.includes(item.id);
            return (
              <TouchableOpacity
                style={styles.storyItem}
                onPress={() => handleCharacterPress(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.storyRing, { borderColor: item.avatarColor }]}>
                  <Avatar color={item.avatarColor} emoji={item.avatarEmoji} size={56} showOnline />
                </View>
                <Text style={styles.storyName} numberOfLines={1}>{item.name}</Text>
                {isFav && <Text style={styles.favDot}>♥</Text>}
              </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.scenarioCard}
                onPress={() => handleScenarioPress(item)}
                activeOpacity={0.8}
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
                        <Avatar color={c.avatarColor} emoji={c.avatarEmoji} size={24} />
                      </View>
                    ) : null;
                  })}
                </View>
              </TouchableOpacity>
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
                <TouchableOpacity
                  key={chat.id}
                  style={styles.chatItem}
                  onPress={() => handleChatPress(chat)}
                  activeOpacity={0.7}
                >
                  {char && !isGroup ? (
                    <Avatar color={char.avatarColor} emoji={char.avatarEmoji} size={50} showOnline />
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
                      {chat.lastMessageTime && (
                        <Text style={styles.chatTime}>{formatTime(chat.lastMessageTime)}</Text>
                      )}
                    </View>
                    <Text style={styles.chatPreview} numberOfLines={1}>
                      {chat.lastMessage || 'Tap to start chatting...'}
                    </Text>
                  </View>
                </TouchableOpacity>
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
  },
  // Stories row
  storiesRow: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  storyItem: {
    alignItems: 'center',
    width: 76,
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
  },
  chatInfo: {
    flex: 1,
    marginLeft: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },
  chatTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
