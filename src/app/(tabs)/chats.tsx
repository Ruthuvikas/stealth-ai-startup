import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatStore } from '../../store/useChatStore';
import { getCharacter } from '../../data/characters';
import { Avatar } from '../../components/common/Avatar';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Chat } from '../../types';

export default function ChatsScreen() {
  const router = useRouter();
  const getSortedChats = useChatStore((s) => s.getSortedChats);
  const chats = getSortedChats();

  const handlePress = (chat: Chat) => {
    if (chat.type === 'group') {
      router.push(`/group/${chat.id}`);
    } else {
      router.push(`/chat/${chat.id}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Chats</Text>

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
              <TouchableOpacity
                style={styles.item}
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
              >
                {char && !isGroup ? (
                  <Avatar color={char.avatarColor} emoji={char.avatarEmoji} size={50} />
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
                {item.lastMessageTime && (
                  <Text style={styles.time}>
                    {formatTime(item.lastMessageTime)}
                  </Text>
                )}
              </TouchableOpacity>
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
  title: {
    ...typography.h1,
    color: '#177245',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: '#FDF9F1',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
