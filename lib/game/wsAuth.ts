import { getSupabaseClient } from '@/lib/supabaseClient';

const DEFAULT_WS_URL = 'wss://wordhex-backend.onrender.com';

function resolveBaseUrl(explicitUrl?: string): string {
  return explicitUrl || process.env.NEXT_PUBLIC_WS_URL || DEFAULT_WS_URL;
}

export async function buildAuthenticatedWsUrl(
  overrideUrl?: string,
  extraParams?: Record<string, string>
): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    // No active session yet, wait before connecting.
    return null;
  }

  const baseUrl = resolveBaseUrl(overrideUrl);
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('token', token);
    if (extraParams) {
      Object.entries(extraParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return url.toString();
  } catch (error) {
    console.error('Failed to build websocket URL', error);
    return null;
  }
}
