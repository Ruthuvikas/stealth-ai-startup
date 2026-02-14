import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../store/useChatStore';
import { useUserStore } from '../../store/useUserStore';
import { getCharacter, getCharactersByIds } from '../../data/characters';
import { getScenario } from '../../data/scenarios';
import { streamGroupResponse, determineGroupResponders } from '../../services/ai';
import { moderateInput } from '../../services/moderation';
import { MessageList } from '../../components/chat/MessageList';
import { MessageInput } from '../../components/chat/MessageInput';
import { Message } from '../../types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userName = useUserStore((s) => s.name);
  const chat = useChatStore((s) => s.chats[id!]);
  const messages = useChatStore((s) => s.messages[id!] || []);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const addReaction = useChatStore((s) => s.addReaction);
  const streamingChatId = useChatStore((s) => s.streamingChatId);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const muteCharacter = useChatStore((s) => s.muteCharacter);
  const unmuteCharacter = useChatStore((s) => s.unmuteCharacter);

  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (!chat || !id) return null;

  const groupCharacters = getCharactersByIds(chat.characterIds);
  const scenario = chat.scenarioId ? getScenario(chat.scenarioId) : null;
  const isStreaming = streamingChatId === id;

  const getCharacterColor = (senderId: string) => {
    const idx = chat.characterIds.indexOf(senderId);
    return idx >= 0 ? colors.characterColors[idx % colors.characterColors.length] : undefined;
  };

  const sendMessage = useCallback(async (text: string) => {
    const modResult = moderateInput(text);
    if (!modResult.safe) {
      addMessage(id!, {
        id: `warn_${Date.now()}`,
        chatId: id!,
        senderId: chat.characterIds[0],
        content: modResult.reason || 'Yeh message nahi bhej sakte.',
        timestamp: Date.now(),
        reactions: [],
      });
      return;
    }

    // Add user message
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      chatId: id!,
      senderId: 'user',
      content: text,
      timestamp: Date.now(),
      reactions: [],
    };
    addMessage(id!, userMsg);

    setStreaming(id!);

    // Determine which characters respond
    const responders = determineGroupResponders(
      text,
      chat.characterIds,
      groupCharacters,
      chat.mutedCharacters
    );

    // Characters respond sequentially
    for (let i = 0; i < responders.length; i++) {
      const charId = responders[i];
      const character = getCharacter(charId);
      if (!character) continue;

      // Add delay between characters
      if (i > 0) {
        await delay(800 + Math.random() * 700);
      }

      setIsTyping(true);

      const aiMsgId = `ai_${charId}_${Date.now()}`;
      const aiMsg: Message = {
        id: aiMsgId,
        chatId: id!,
        senderId: charId,
        content: '',
        timestamp: Date.now(),
        reactions: [],
        isStreaming: true,
      };
      addMessage(id!, aiMsg);

      const currentMessages = [...useChatStore.getState().messages[id!] || []];

      await new Promise<void>((resolve) => {
        streamGroupResponse(
          character,
          chat.characterIds,
          groupCharacters,
          currentMessages.filter((m) => m.id !== aiMsgId),
          userName,
          (token) => {
            const current = useChatStore.getState().messages[id!]?.find((m) => m.id === aiMsgId);
            if (current) {
              updateMessage(id!, aiMsgId, { content: current.content + token });
            }
          },
          (fullText) => {
            updateMessage(id!, aiMsgId, { content: fullText, isStreaming: false });
            setIsTyping(false);
            resolve();
          },
          (error) => {
            console.error('Group AI error:', error);
            updateMessage(id!, aiMsgId, {
              content: 'Network issue aa gaya yaar 😅',
              isStreaming: false,
            });
            setIsTyping(false);
            resolve();
          }
        );
      });
    }

    setStreaming(null);
  }, [id, chat, groupCharacters, userName]);

  const handleMuteToggle = (charId: string) => {
    if (chat.mutedCharacters.includes(charId)) {
      unmuteCharacter(id!, charId);
    } else {
      muteCharacter(id!, charId);
    }
  };

  // Build subtitle showing character names
  const subtitle = groupCharacters.map((c) => c.name).join(', ');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.avatarStack}>
          {groupCharacters.slice(0, 3).map((c, i) => (
            <View key={c.id} style={[styles.stackedAvatar, { marginLeft: i > 0 ? -10 : 0, zIndex: 3 - i }]}>
              <View style={[styles.miniAvatar, { backgroundColor: c.avatarColor + '30' }]}>
                <Text style={{ fontSize: 14 }}>{c.avatarEmoji}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{chat.title}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{subtitle}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={styles.menuBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Menu dropdown */}
      {showMenu && (
        <View style={styles.menu}>
          {groupCharacters.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.menuItem}
              onPress={() => {
                handleMuteToggle(c.id);
                setShowMenu(false);
              }}
            >
              <Text style={styles.menuText}>
                {chat.mutedCharacters.includes(c.id) ? `Unmute ${c.name}` : `Mute ${c.name}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {messages.length === 0 && scenario ? (
          <View style={styles.scenarioIntro}>
            <Text style={styles.scenarioEmoji}>{scenario.emoji}</Text>
            <Text style={styles.scenarioTitle}>{scenario.name}</Text>
            <Text style={styles.scenarioDesc}>{scenario.openingContext}</Text>
          </View>
        ) : null}

        <MessageList
          messages={messages}
          isTyping={isTyping && !messages.some((m) => m.isStreaming)}
          onReact={(msgId, emoji) => addReaction(id!, msgId, emoji)}
          showSenderName
          getCharacterColor={getCharacterColor}
        />
        <MessageInput onSend={sendMessage} disabled={isStreaming} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: {
    padding: spacing.xs,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackedAvatar: {},
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 15,
  },
  headerSub: {
    ...typography.small,
    color: colors.textMuted,
  },
  menuBtn: {
    padding: spacing.sm,
  },
  menu: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    padding: spacing.sm,
    zIndex: 50,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  menuText: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 14,
  },
  chatArea: {
    flex: 1,
  },
  scenarioIntro: {
    alignItems: 'center',
    padding: spacing.xxl,
    paddingTop: spacing.xxxl,
  },
  scenarioEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  scenarioTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  scenarioDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
});
