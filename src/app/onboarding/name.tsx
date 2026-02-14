import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring } from 'react-native-reanimated';
import { useUserStore } from '../../store/useUserStore';
import { GradientButton } from '../../components/common/GradientButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export default function NameScreen() {
  const router = useRouter();
  const setName = useUserStore((s) => s.setName);
  const [name, setNameLocal] = useState('');

  const headOpacity = useSharedValue(0);
  const headY = useSharedValue(30);
  const inputOpacity = useSharedValue(0);

  useEffect(() => {
    headOpacity.value = withTiming(1, { duration: 500 });
    headY.value = withSpring(0, { damping: 15 });
    inputOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
  }, []);

  const headStyle = useAnimatedStyle(() => ({
    opacity: headOpacity.value,
    transform: [{ translateY: headY.value }],
  }));

  const inputStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
  }));

  const isValid = name.trim().length >= 2;

  const handleNext = () => {
    if (!isValid) return;
    setName(name.trim());
    router.push('/onboarding/characters');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Subtle bg gradient */}
      <LinearGradient
        colors={['#00A88810', 'transparent']}
        style={styles.bgGlow}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <Animated.View style={[styles.content, headStyle]}>
          <View style={styles.emojiRow}>
            <Text style={styles.emoji}>🎭</Text>
            <Text style={styles.emoji}>💬</Text>
            <Text style={styles.emoji}>🇮🇳</Text>
          </View>
          <Text style={styles.title}>Welcome to AI Adda!</Text>
          <Text style={styles.subtitle}>
            Chat with AI characters who speak your language{'\n'}Hinglish, drama, aur bahut masti 🎉
          </Text>
        </Animated.View>

        <Animated.View style={[styles.inputSection, inputStyle]}>
          <Text style={styles.label}>What should we call you?</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Apna naam daal..."
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setNameLocal}
              autoFocus
              maxLength={20}
              returnKeyType="next"
              onSubmitEditing={handleNext}
            />
          </View>
        </Animated.View>

        <View style={styles.bottom}>
          <GradientButton
            title="Let's Go! →"
            onPress={handleNext}
            disabled={!isValid}
          />
          <Text style={styles.hint}>Minimum 2 characters</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  bgGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 32,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 24,
  },
  inputSection: {
    marginTop: -20,
  },
  label: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  inputWrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.primary + '40',
  },
  input: {
    ...typography.h3,
    color: colors.textPrimary,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.xl,
    paddingVertical: 16,
    textAlign: 'center',
    fontSize: 20,
  },
  bottom: {
    paddingBottom: 40,
    alignItems: 'center',
    gap: spacing.md,
  },
  hint: {
    ...typography.small,
    color: colors.textMuted,
  },
});
