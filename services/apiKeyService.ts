

const PEXELS_API_KEY_NAME = 'pexels_api_key';

export type ApiKeyName = 'GEMINI' | 'PEXELS';

export const saveApiKey = (keyName: ApiKeyName, keyValue: string): void => {
  // Fix: Per Gemini API guidelines, do not handle API key via UI.
  if (keyName === 'GEMINI') {
    return;
  }

  // Handle Pexels key storage
  if (!keyValue) {
    sessionStorage.removeItem(PEXELS_API_KEY_NAME);
  } else {
    sessionStorage.setItem(PEXELS_API_KEY_NAME, keyValue);
  }
};

export const getApiKey = (keyName: ApiKeyName): string | null => {
  // Fix: Per Gemini API guidelines, API key must be obtained exclusively from process.env.API_KEY.
  if (keyName === 'GEMINI') {
    return process.env.API_KEY || null;
  }

  // Pexels key logic
  if (keyName === 'PEXELS') {
    // Prioritize session storage for user-provided keys.
    const sessionKey = sessionStorage.getItem(PEXELS_API_KEY_NAME);
    if (sessionKey) {
      return sessionKey;
    }
    // Fallback to environment variables if available.
    return process.env.PEXELS_API_KEY || null;
  }

  return null;
};

export const getMissingKeys = (): ApiKeyName[] => {
    const missing: ApiKeyName[] = [];
    // Fix: Per Gemini API guidelines, assume key is present in environment and do not prompt user.
    if (!getApiKey('PEXELS')) {
        missing.push('PEXELS');
    }
    return missing;
}
