const ADMIN_TOKEN_KEY = 'admin_token';

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token: string): void => {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch (err) {
    console.error('Failed to store token in localStorage:', err);
  }
};

export const removeStoredToken = (): void => {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch (err) {
    console.error('Failed to remove token from localStorage:', err);
  }
};
