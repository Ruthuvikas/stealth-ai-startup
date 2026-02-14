import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../store/useUserStore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSequence, Easing } from 'react-native-reanimated';

export default function SplashScreen() {
  const router = useRouter();
  const loggedIn = useUserStore((s) => s.loggedIn);
  const onboarded = useUserStore((s) => s.onboarded);

  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 500 });
    logoScale.value = withSequence(
      withTiming(1.1, { duration: 400, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 200 })
    );
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    titleY.value = withDelay(300, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
    subtitleOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));

    const timer = setTimeout(() => {
      if (!loggedIn) {
        router.replace('/auth/login');
      } else if (onboarded) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding/name');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [loggedIn, onboarded]);

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <LinearGradient
        colors={['#0B141A', '#102229', '#0B141A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.logoBg}
        >
          <Text style={styles.logoEmoji}>🎭</Text>
        </LinearGradient>
      </Animated.View>

      <Animated.Text style={[styles.title, titleStyle]}>AI Adda</Animated.Text>
      <Animated.Text style={[styles.subtitle, subtitleStyle]}>
        Your AI dost, always online 💬
      </Animated.Text>

      <View style={styles.footer}>
        <Text style={styles.footerText}>from</Text>
        <Text style={styles.footerBrand}>stealth labs ✦</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBg: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 44,
  },
  title: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  footerText: {
    ...typography.small,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  footerBrand: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
});
