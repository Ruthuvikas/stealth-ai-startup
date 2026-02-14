import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useUserStore } from '../store/useUserStore';
import { useChatStore } from '../store/useChatStore';
import { colors } from '../theme/colors';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function hydrate() {
      await Promise.all([
        useUserStore.getState().hydrate(),
        useChatStore.getState().hydrate(),
      ]);
      setReady(true);
    }
    hydrate();
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
