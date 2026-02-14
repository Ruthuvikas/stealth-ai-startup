import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../store/useChatStore';
import { useUserStore } from '../../store/useUserStore';
import { getCharacter } from '../../data/characters';
import { Avatar } from '../../components/common/Avatar';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Chat } from '../../types';

export default function ChatsScreen() {
  const router = useRouter();
  const getSortedChats = useChatStore((s) => s.getSortedChats);
  const logout = useUserStore((s) => s.logout);
  const chats = getSortedChats();
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [hoveredLogout, setHoveredLogout] = useState(false);

  const handlePress = (chat: Chat) => {
    if (chat.type === 'group') {
      router.push(`/group/${chat.id}`);
    } else {
      router.push(`/chat/${chat.id}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            hoveredLogout && styles.logoutBtnHover,
            pressed && styles.logoutBtnPressed,
          ]}
          onHoverIn={() => setHoveredLogout(true)}
          onHoverOut={() => setHoveredLogout(false)}
        >
          <Ionicons name="log-out-outline" size={21} color={colors.textSecondary} />
        </Pressable>
      </View>

      {chats.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyText}>Koi chat nahi hai abhi</Text>
          <Text style={styles.emptySubtext}>Home se kisi character ko tap karo!</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const char = getCharacter(item.characterIds[0]);
            const isGroup = item.type === 'group';
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.item,
                  hoveredChatId === item.id && styles.itemHover,
                  pressed && styles.itemPressed,
                ]}
                onPress={() => handlePress(item)}
                onHoverIn={() => setHoveredChatId(item.id)}
                onHoverOut={() => setHoveredChatId(null)}
              >
                {char && !isGroup ? (
                  <Avatar color={char.avatarColor} emoji={char.avatarEmoji} image={char.avatarImage} size={50} />
                ) : (
                  <View style={styles.groupAvatar}>
                    <Text style={{ fontSize: 22 }}>👥</Text>
                  </View>
                )}
                <View style={styles.info}>
                  <Text style={styles.name}>
                    {isGroup ? item.title : char?.name || 'Chat'}
                  </Text>
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.lastMessage || 'Start chatting...'}
                  </Text>
                </View>
                <View style={styles.metaRight}>
                  {item.lastMessageTime && (
                    <Text style={styles.time}>
                      {formatTime(item.lastMessageTime)}
                    </Text>
                  )}
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </View>
              </Pressable>
            );
          }}
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.xxl,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  logoutBtn: {
    marginTop: spacing.xs,
    padding: spacing.xs,
    borderRadius: 10,
  },
  logoutBtnHover: {
    backgroundColor: colors.bgElevated,
  },
  logoutBtnPressed: {
    backgroundColor: '#2A3942',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  itemHover: {
    borderColor: colors.borderLight,
    backgroundColor: colors.bgElevated,
  },
  itemPressed: {
    opacity: 0.92,
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  preview: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  time: {
    ...typography.small,
    color: colors.textMuted,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
