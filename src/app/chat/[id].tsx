import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../store/useChatStore';
import { useUserStore } from '../../store/useUserStore';
import { getCharacter } from '../../data/characters';
import { getStartersForCharacter } from '../../data/starters';
import { streamCharacterResponse } from '../../services/ai';
import { moderateInput } from '../../services/moderation';
import { MessageList } from '../../components/chat/MessageList';
import { MessageInput } from '../../components/chat/MessageInput';
import { ConversationStarters } from '../../components/chat/ConversationStarters';
import { Avatar } from '../../components/common/Avatar';
import { Message } from '../../types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userName = useUserStore((s) => s.name);
  const chat = useChatStore((s) => s.chats[id!]);
  const messages = useChatStore((s) => s.messages[id!] || []);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const addReaction = useChatStore((s) => s.addReaction);
  const removeLastAIMessage = useChatStore((s) => s.removeLastAIMessage);
  const streamingChatId = useChatStore((s) => s.streamingChatId);
  const setStreaming = useChatStore((s) => s.setStreaming);

  const [isTyping, setIsTyping] = useState(false);

  if (!chat || !id) return null;

  const characterId = chat.characterIds[0];
  const character = getCharacter(characterId);
  if (!character) return null;

  const starters = getStartersForCharacter(characterId);
  const isStreaming = streamingChatId === id;
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  };

  const sendMessage = useCallback(async (text: string) => {
    const modResult = moderateInput(text);
    if (!modResult.safe) {
      const warningMsg: Message = {
        id: `warn_${Date.now()}`,
        chatId: id!,
        senderId: characterId,
        content: modResult.reason || 'Yeh message bhejne mein dikkat hai.',
        timestamp: Date.now(),
        reactions: [],
      };
      addMessage(id!, warningMsg);
      return;
    }

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      chatId: id!,
      senderId: 'user',
      content: text,
      timestamp: Date.now(),
      reactions: [],
    };
    addMessage(id!, userMsg);

    setIsTyping(true);
    setStreaming(id!);

    const aiMsgId = `ai_${Date.now()}`;
    const aiMsg: Message = {
      id: aiMsgId,
      chatId: id!,
      senderId: characterId,
      content: '',
      timestamp: Date.now(),
      reactions: [],
      isStreaming: true,
    };
    addMessage(id!, aiMsg);

    const currentMessages = [...useChatStore.getState().messages[id!] || []];

    await streamCharacterResponse(
      character,
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
        setStreaming(null);
      },
      (error) => {
        console.error('AI error:', error);
        updateMessage(id!, aiMsgId, {
          content: 'Arre yaar, network issue ho gaya. Phir se try kar! 😅',
          isStreaming: false,
        });
        setIsTyping(false);
        setStreaming(null);
      }
    );
  }, [id, characterId, character, userName]);

  const handleRegenerate = useCallback(async () => {
    const removed = removeLastAIMessage(id!);
    if (!removed) return;

    setIsTyping(true);
    setStreaming(id!);

    const aiMsgId = `ai_regen_${Date.now()}`;
    const aiMsg: Message = {
      id: aiMsgId,
      chatId: id!,
      senderId: characterId,
      content: '',
      timestamp: Date.now(),
      reactions: [],
      isStreaming: true,
    };
    addMessage(id!, aiMsg);

    const currentMessages = [...useChatStore.getState().messages[id!] || []];

    await streamCharacterResponse(
      character,
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
        setStreaming(null);
      },
      (error) => {
        updateMessage(id!, aiMsgId, {
          content: 'Network mein kuch gadbad hai bhai 😅',
          isStreaming: false,
        });
        setIsTyping(false);
        setStreaming(null);
      }
    );
  }, [id, characterId, character, userName]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* WhatsApp-style header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Avatar color={character.avatarColor} emoji={character.avatarEmoji} image={character.avatarImage} size={38} showOnline />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{character.name}</Text>
          <Text style={styles.headerStatus}>
            {isStreaming ? 'typing...' : 'online'}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="videocam" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="call" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Chat wallpaper pattern */}
        <View style={styles.chatBg}>
          <LinearGradient
            colors={['#FFFFFFAA', '#F0E4D300', '#EADCC8AA']}
            style={styles.chatPatternTop}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <LinearGradient
            colors={['#E7D8C300', '#DFCBB0A0', '#FFFFFF30']}
            style={styles.chatPatternBottom}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          {messages.length === 0 ? (
            <View style={styles.starterArea}>
              <View style={styles.starterCard}>
                <Avatar color={character.avatarColor} emoji={character.avatarEmoji} image={character.avatarImage} size={72} showOnline />
                <Text style={styles.starterTitle}>{character.name}</Text>
                <Text style={styles.starterRole}>{character.archetype} • {character.city}</Text>
                <Text style={styles.starterTagline}>"{character.tagline}"</Text>
              </View>
              <ConversationStarters starters={starters} onSelect={sendMessage} />
            </View>
          ) : (
            <MessageList
              messages={messages}
              isTyping={isTyping && !messages.some((m) => m.isStreaming)}
              onReact={(msgId, emoji) => addReaction(id!, msgId, emoji)}
              onRegenerate={handleRegenerate}
            />
          )}
        </View>
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
    paddingHorizontal: 6,
    paddingVertical: 7,
    backgroundColor: '#FDF9F1',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
    shadowColor: '#B49D7C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  backBtn: {
    padding: 5,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 16,
  },
  headerStatus: {
    ...typography.small,
    color: colors.primary,
    fontSize: 12,
  },
  headerAction: {
    padding: 6,
  },
  chatArea: {
    flex: 1,
  },
  chatBg: {
    flex: 1,
    backgroundColor: colors.chatBg,
    position: 'relative',
  },
  chatPatternTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    opacity: 0.25,
  },
  chatPatternBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    opacity: 0.22,
  },
  starterArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  starterCard: {
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxxl,
    borderRadius: 16,
    marginHorizontal: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#B49D7C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  starterTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  starterRole: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  starterTagline: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
