import { create } from 'zustand';
import { UserProfile } from '../types';
import { saveData, loadData, KEYS } from '../services/storage';
import {
  SupabaseSession,
  fetchProfile,
  getCurrentUser,
  isSupabaseConfigured,
  refreshSupabaseSession,
  resendSignupVerificationEmail,
  signInWithEmail,
  signUpWithEmail,
  supabaseSignOut,
  upsertProfile,
} from '../services/supabase';

interface AuthResult {
  ok: boolean;
  error?: string;
  needsOnboarding?: boolean;
  pendingVerification?: boolean;
}

interface UserState extends UserProfile {
  authSession: SupabaseSession | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (email: string, password: string) => Promise<AuthResult>;
  resendVerificationEmail: (email: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  setName: (name: string) => void;
  setFavoriteCharacters: (ids: string[]) => void;
  completeOnboarding: () => void;
  hydrate: () => Promise<void>;
}

const SESSION_REFRESH_BUFFER_SECONDS = 60;

function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sanitizeName(name: string): string {
  return name.trim();
}

function normalizeAuthError(error: unknown): string {
  const fallback = 'Something went wrong. Please try again.';
  if (!(error instanceof Error)) return fallback;

  const raw = error.message || fallback;
  if (raw.toLowerCase().includes('invalid login credentials')) {
    return 'Invalid email or password.';
  }
  if (raw.toLowerCase().includes('email not confirmed')) {
    return 'Please verify your email first, then login.';
  }
  return raw;
}

function pickPersistedUser(state: UserState): UserProfile {
  return {
    userId: state.userId,
    email: state.email,
    name: state.name,
    favoriteCharacters: state.favoriteCharacters,
    onboarded: state.onboarded,
    loggedIn: state.loggedIn,
  };
}

async function persistUser(state: UserState): Promise<void> {
  await saveData(KEYS.USER, pickPersistedUser(state));
}

async function persistSession(session: SupabaseSession | null): Promise<void> {
  await saveData(KEYS.AUTH_SESSION, session);
}

export const useUserStore = create<UserState>((set, get) => {
  const syncProfileIfPossible = async () => {
    const state = get();
    if (!state.loggedIn || !state.authSession || !state.userId || !state.email) return;

    try {
      await upsertProfile(state.authSession.accessToken, {
        id: state.userId,
        email: state.email,
        name: state.name || undefined,
        favorite_characters: state.favoriteCharacters,
        onboarded: state.onboarded,
      });
    } catch (error) {
      console.warn('Profile sync failed:', error);
    }
  };

  const completeLoginFromSession = async (session: SupabaseSession): Promise<AuthResult> => {
    try {
      const user = session.user.id ? session.user : await getCurrentUser(session.accessToken);
      const userId = user.id;
      const email = user.email ? sanitizeEmail(user.email) : '';

      if (!userId || !email) {
        return { ok: false, error: 'Supabase user info incomplete. Check auth settings.' };
      }

      let name = '';
      let favoriteCharacters: string[] = [];
      let onboarded = false;

      const remoteProfile = await fetchProfile(session.accessToken, userId);
      if (remoteProfile) {
        name = remoteProfile.name || '';
        favoriteCharacters = remoteProfile.favorite_characters || [];
        onboarded = Boolean(remoteProfile.onboarded);
      } else {
        await upsertProfile(session.accessToken, {
          id: userId,
          email,
          onboarded: false,
          favorite_characters: [],
        });
      }

      set({
        authSession: session,
        userId,
        email,
        name,
        favoriteCharacters,
        onboarded,
        loggedIn: true,
      });

      await Promise.all([persistSession(session), persistUser(get())]);

      return { ok: true, needsOnboarding: !onboarded };
    } catch (error) {
      return { ok: false, error: normalizeAuthError(error) };
    }
  };

  return {
    userId: '',
    email: '',
    name: '',
    favoriteCharacters: [],
    onboarded: false,
    loggedIn: false,
    authSession: null,

    login: async (email: string, password: string) => {
      if (!isSupabaseConfigured()) {
        return {
          ok: false,
          error: 'Supabase not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
        };
      }

      try {
        const session = await signInWithEmail(sanitizeEmail(email), password);
        return completeLoginFromSession(session);
      } catch (error) {
        return { ok: false, error: normalizeAuthError(error) };
      }
    },

    signup: async (email: string, password: string) => {
      if (!isSupabaseConfigured()) {
        return {
          ok: false,
          error: 'Supabase not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
        };
      }

      try {
        const { session, user } = await signUpWithEmail(sanitizeEmail(email), password);

        if (!session) {
          return {
            ok: true,
            pendingVerification: true,
            error: user?.email
              ? `Verification email sent to ${user.email}. Please confirm then login.`
              : 'Verification email sent. Please confirm then login.',
          };
        }

        return completeLoginFromSession(session);
      } catch (error) {
        return { ok: false, error: normalizeAuthError(error) };
      }
    },

    resendVerificationEmail: async (email: string) => {
      if (!isSupabaseConfigured()) {
        return {
          ok: false,
          error: 'Supabase not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
        };
      }

      try {
        await resendSignupVerificationEmail(sanitizeEmail(email));
        return { ok: true };
      } catch (error) {
        return { ok: false, error: normalizeAuthError(error) };
      }
    },

    logout: async () => {
      const currentSession = get().authSession;
      if (currentSession) {
        try {
          await supabaseSignOut(currentSession.accessToken);
        } catch (error) {
          console.warn('Supabase logout failed:', error);
        }
      }

      set({
        authSession: null,
        userId: '',
        email: '',
        name: '',
        favoriteCharacters: [],
        onboarded: false,
        loggedIn: false,
      });

      await Promise.all([persistSession(null), persistUser(get())]);
    },

    setName: (name: string) => {
      const nextName = sanitizeName(name);
      set({ name: nextName });
      void persistUser(get());
      void syncProfileIfPossible();
    },

    setFavoriteCharacters: (ids: string[]) => {
      set({ favoriteCharacters: ids });
      void persistUser(get());
      void syncProfileIfPossible();
    },

    completeOnboarding: () => {
      set({ onboarded: true, loggedIn: true });
      void persistUser(get());
      void syncProfileIfPossible();
    },

    hydrate: async () => {
      const [savedUser, savedSession] = await Promise.all([
        loadData<Partial<UserProfile>>(KEYS.USER),
        loadData<SupabaseSession | null>(KEYS.AUTH_SESSION),
      ]);

      if (savedUser) {
        set({
          userId: savedUser.userId || '',
          email: savedUser.email || '',
          name: savedUser.name || '',
          favoriteCharacters: savedUser.favoriteCharacters || [],
          onboarded: Boolean(savedUser.onboarded),
          loggedIn: Boolean(savedUser.loggedIn),
        });
      }

      if (!savedSession || !isSupabaseConfigured()) {
        set({ authSession: null, loggedIn: false });
        await Promise.all([persistSession(null), persistUser(get())]);
        return;
      }

      try {
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const shouldRefresh = savedSession.expiresAt <= nowInSeconds + SESSION_REFRESH_BUFFER_SECONDS;
        const activeSession = shouldRefresh
          ? await refreshSupabaseSession(savedSession.refreshToken)
          : savedSession;

        const result = await completeLoginFromSession(activeSession);
        if (!result.ok) {
          throw new Error(result.error || 'Session restore failed');
        }
      } catch {
        set({ authSession: null, loggedIn: false });
        await Promise.all([persistSession(null), persistUser(get())]);
      }
    },
  };
});
