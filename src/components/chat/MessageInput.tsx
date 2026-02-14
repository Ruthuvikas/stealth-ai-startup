import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const hasText = text.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="happy-outline" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          editable={!disabled}
          returnKeyType="default"
        />
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="attach" size={24} color={colors.textMuted} />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.sm : spacing.sm,
    gap: spacing.sm,
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBtn: {
    padding: spacing.sm,
    paddingBottom: 10,
  },
  input: {
    flex: 1,
    ...typography.chat,
    color: colors.textPrimary,
    paddingVertical: 10,
    paddingHorizontal: 4,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendActive: {
    backgroundColor: colors.primary,
  },
});
