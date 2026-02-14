interface SupabaseUser {
  id: string;
  email?: string;
}

export interface SupabaseSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
  user: SupabaseUser;
}

export interface UserProfileRow {
  id: string;
  email: string | null;
  name: string | null;
  favorite_characters: string[] | null;
  onboarded: boolean | null;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function hasConfig(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function getConfig() {
  if (!hasConfig()) {
    throw new Error('Missing Supabase config. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY).');
  }
  return { supabaseUrl: supabaseUrl as string, supabaseAnonKey: supabaseAnonKey as string };
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { supabaseUrl, supabaseAnonKey } = getConfig();
  const response = await fetch(`${supabaseUrl}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const body = await parseJson<{ error_description?: string; msg?: string; error?: string } & T>(response);

  if (!response.ok) {
    throw new Error(body.error_description || body.msg || body.error || 'Supabase auth request failed');
  }

  return body as T;
}

function toSession(payload: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user?: SupabaseUser;
}): SupabaseSession {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: payload.expires_at || nowInSeconds + (payload.expires_in || 3600),
    tokenType: payload.token_type || 'bearer',
    user: payload.user || { id: '' },
  };
}

export function isSupabaseConfigured(): boolean {
  return hasConfig();
}

export async function signUpWithEmail(email: string, password: string): Promise<{ session: SupabaseSession | null; user: SupabaseUser | null }> {
  const data = await authRequest<{
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    expires_in?: number;
    token_type?: string;
    user?: SupabaseUser;
  }>('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const session = data.access_token && data.refresh_token ? toSession(data as Required<typeof data>) : null;
  return { session, user: data.user || null };
}

export async function resendSignupVerificationEmail(email: string): Promise<void> {
  await authRequest('/resend', {
    method: 'POST',
    body: JSON.stringify({ type: 'signup', email }),
  });
}

export async function signInWithEmail(email: string, password: string): Promise<SupabaseSession> {
  const data = await authRequest<{
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    expires_in?: number;
    token_type?: string;
    user?: SupabaseUser;
  }>('/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return toSession(data);
}

export async function refreshSupabaseSession(refreshToken: string): Promise<SupabaseSession> {
  const data = await authRequest<{
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    expires_in?: number;
    token_type?: string;
    user?: SupabaseUser;
  }>('/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  return toSession(data);
}

export async function getCurrentUser(accessToken: string): Promise<SupabaseUser> {
  return authRequest<SupabaseUser>('/user', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function supabaseSignOut(accessToken: string): Promise<void> {
  await authRequest('/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function restRequest<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const { supabaseUrl, supabaseAnonKey } = getConfig();
  const response = await fetch(`${supabaseUrl}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const body = await parseJson<T & { message?: string; error?: string }>(response);
  if (!response.ok) {
    throw new Error(body.message || body.error || 'Supabase data request failed');
  }
  return body as T;
}

export async function upsertProfile(
  accessToken: string,
  profile: {
    id: string;
    email: string;
    name?: string;
    favorite_characters?: string[];
    onboarded?: boolean;
  }
): Promise<void> {
  await restRequest('/profiles?on_conflict=id', accessToken, {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(profile),
  });
}

export async function fetchProfile(accessToken: string, userId: string): Promise<UserProfileRow | null> {
  const rows = await restRequest<UserProfileRow[]>(
    `/profiles?id=eq.${encodeURIComponent(userId)}&select=id,email,name,favorite_characters,onboarded`,
    accessToken,
    { method: 'GET' }
  );

  return rows[0] || null;
}
