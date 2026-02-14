import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  mentionableNames?: string[];
}

export function MessageInput({ onSend, disabled, mentionableNames = [] }: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const hasText = text.trim().length > 0;
  const mentionMatch = text.match(/(?:^|\s)@([a-z0-9_]*)$/i);
  const mentionQuery = mentionMatch?.[1]?.toLowerCase() ?? null;
  const mentionCandidates = mentionQuery !== null
    ? mentionableNames.filter((name) => name.toLowerCase().startsWith(mentionQuery)).slice(0, 5)
    : [];

  const insertMention = (name: string) => {
    setText((prev) => prev.replace(/(?:^|\s)@([a-z0-9_]*)$/i, (match) => {
      const leadingSpace = match.startsWith(' ') ? ' ' : '';
      return `${leadingSpace}@${name} `;
    }));
  };

  return (
    <View style={styles.wrapper}>
      {mentionCandidates.length > 0 ? (
        <View style={styles.mentionList}>
          {mentionCandidates.map((name) => (
            <TouchableOpacity key={name} style={styles.mentionItem} onPress={() => insertMention(name)}>
              <Text style={styles.mentionText}>@{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      <View style={styles.container}>
      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="happy-outline" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Message"
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline={false}
          maxLength={500}
          editable={!disabled}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="camera-outline" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.sendButton, hasText && !disabled && styles.sendActive]}
        onPress={handleSend}
        disabled={!hasText || disabled}
      >
        {hasText ? (
          <Ionicons name="send" size={20} color="#fff" />
        ) : (
          <Ionicons name="mic" size={22} color="#fff" />
        )}
      </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#F3EBDD',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mentionList: {
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mentionItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mentionText: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 14,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
    paddingVertical: 6,
    paddingBottom: Platform.OS === 'ios' ? 6 : 6,
    gap: spacing.sm,
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.bgInput,
    borderRadius: 24,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: '#D9CCB9',
  },
  iconBtn: {
    padding: 7,
    paddingBottom: 9,
  },
  input: {
    flex: 1,
    ...typography.chat,
    color: colors.textPrimary,
    paddingVertical: 10,
    paddingHorizontal: 4,
    maxHeight: 42,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#B9C6B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendActive: {
    backgroundColor: colors.primary,
  },
});
