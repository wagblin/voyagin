import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'voyagin.auth.token';
const USER_KEY = 'voyagin.auth.user';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getStoredUser(): Promise<StoredUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (raw === null) {
    return null;
  }
  return JSON.parse(raw) as StoredUser;
}

export async function setStoredUser(user: StoredUser): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
