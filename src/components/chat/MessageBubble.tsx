import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Message } from '../../types';
import { getCharacter } from '../../data/characters';
import { Avatar } from '../common/Avatar';
import { ReactionPicker } from './ReactionPicker';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { Ionicons } from '@expo/vector-icons';

interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderColor?: string;
  onReact?: (emoji: string) => void;
  onRegenerate?: () => void;
  isLastAI?: boolean;
}

function formatMsgTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({
  message,
  isUser,
  showAvatar = true,
  senderName,
  senderColor,
  onReact,
  onRegenerate,
  isLastAI,
}: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const character = !isUser ? getCharacter(message.senderId) : null;
  const userReceiptIcon = message.isStreaming ? 'checkmark' : 'checkmark-done';
  const userReceiptColor = message.isStreaming ? colors.textMuted : colors.textLink;
  const hasContent = message.content.trim().length > 0;
  const visibleContent = hasContent ? message.content : !message.isStreaming ? '...' : '';

  return (
    <>
      <Animated.View
        entering={FadeInDown.duration(180).springify().damping(18)}
        style={[styles.row, isUser && styles.rowUser]}
      >
        {!isUser && showAvatar && character && (
          <View style={styles.avatarCol}>
            <Avatar color={character.avatarColor} emoji={character.avatarEmoji} image={character.avatarImage} size={30} />
          </View>
        )}
        {!isUser && showAvatar && !character && <View style={{ width: 38 }} />}

        <Pressable
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAI,
            !showAvatar && !isUser && { marginLeft: 38 },
          ]}
          onLongPress={() => !isUser && onReact && setShowReactions(true)}
        >
          {/* Bubble tail */}
          <View style={[styles.tail, isUser ? styles.tailUser : styles.tailAI]} />

          {senderName && !isUser && (
            <Text style={[styles.senderName, senderColor ? { color: senderColor } : {}]}>
              {senderName}
            </Text>
          )}

          <Text style={[styles.text, isUser && styles.textUser]}>
            {visibleContent}
            {message.isStreaming && <Text style={styles.cursor}>|</Text>}
          </Text>

          {/* Timestamp + read receipt row */}
          <View style={styles.metaRow}>
            <Text style={[styles.time, isUser && styles.timeUser]}>
              {formatMsgTime(message.timestamp)}
            </Text>
            {isUser && (
              <Ionicons
                name={userReceiptIcon}
                size={14}
                color={userReceiptColor}
                style={{ marginLeft: 3 }}
              />
            )}
          </View>

          {/* Reactions */}
          {message.reactions.length > 0 && (
            <View style={styles.reactions}>
              {message.reactions.map((r, i) => (
                <View key={i} style={styles.reactionBubble}>
                  <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                </View>
              ))}
            </View>
          )}
        </Pressable>
      </Animated.View>

      {/* Regenerate button */}
      {isLastAI && onRegenerate && !message.isStreaming && (
        <TouchableOpacity onPress={onRegenerate} style={styles.regenerateRow}>
          <Ionicons name="refresh" size={14} color={colors.textMuted} />
          <Text style={styles.regenerateText}>Regenerate</Text>
        </TouchableOpacity>
      )}

      {showReactions && onReact && (
        <ReactionPicker
          onReact={onReact}
          onClose={() => setShowReactions(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    gap: spacing.xs,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  avatarCol: {
    marginBottom: 3,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingTop: 7,
    paddingBottom: 4,
    borderRadius: 14,
    position: 'relative',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: colors.bubbleUser,
    borderTopRightRadius: 4,
    borderColor: '#0C6A57',
  },
  bubbleAI: {
    backgroundColor: colors.bubbleAI,
    borderTopLeftRadius: 4,
    borderColor: colors.border,
  },
  // Bubble tail
  tail: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
  },
  tailUser: {
    right: -6,
    borderLeftWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: colors.bubbleUser,
    borderTopColor: colors.bubbleUser,
    borderRightWidth: 6,
    borderRightColor: 'transparent',
    borderBottomWidth: 6,
    borderBottomColor: 'transparent',
  },
  tailAI: {
    left: -6,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderRightColor: colors.bubbleAI,
    borderTopColor: colors.bubbleAI,
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
    borderBottomWidth: 6,
    borderBottomColor: 'transparent',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 1,
  },
  text: {
    ...typography.chat,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  textUser: {
    color: '#E9EDEF',
  },
  cursor: {
    color: colors.primary,
    fontWeight: '300',
  },
  // Meta (time + read receipt)
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 1,
  },
  time: {
    fontSize: 10.5,
    color: colors.textMuted,
  },
  timeUser: {
    color: '#A5C7BD',
  },
  // Reactions
  reactions: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },
  reactionBubble: {
    backgroundColor: '#2A3942',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  // Regenerate
  regenerateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 50,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
  },
  regenerateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
