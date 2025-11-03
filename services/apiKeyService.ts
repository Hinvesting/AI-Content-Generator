const GEMINI_API_KEY_NAME = 'gemini_api_key';
const PEXELS_API_KEY_NAME = 'pexels_api_key';

export type ApiKeyName = 'GEMINI' | 'PEXELS' | 'GOOGLE_CLIENT_ID' | 'GOOGLE_API_KEY';

export const saveApiKey = (keyName: ApiKeyName, keyValue: string): void => {
  let storageKey: string;
  switch (keyName) {
    case 'GEMINI':
      storageKey = GEMINI_API_KEY_NAME;
      break;
    case 'PEXELS':
      storageKey = PEXELS_API_KEY_NAME;
      break;
    default:
      return;
  }

  const trimmedValue = keyValue.trim();
  if (!trimmedValue) {
    sessionStorage.removeItem(storageKey);
  } else {
    sessionStorage.setItem(storageKey, trimmedValue);
  }
};

export const getApiKey = (keyName: ApiKeyName): string | null => {
  // Prioritize session storage for user-provided keys.
  if (keyName === 'GEMINI') {
    const sessionKey = sessionStorage.getItem(GEMINI_API_KEY_NAME);
    if (sessionKey) {
      return sessionKey;
    }
    // Fallback to environment variables if available.
    return process.env.API_KEY || null;
  }

  if (keyName === 'PEXELS') {
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
    if (!getApiKey('GEMINI')) {
        missing.push('GEMINI');
    }
    if (!getApiKey('PEXELS')) {
        missing.push('PEXELS');
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
        missing.push('GOOGLE_CLIENT_ID');
    }
    if (!process.env.GOOGLE_API_KEY) {
        missing.push('GOOGLE_API_KEY');
    }
    return missing;
}