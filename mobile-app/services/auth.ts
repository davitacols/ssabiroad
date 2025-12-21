import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://ssabiroad.com';

export interface User {
  id: string;
  email: string;
  name?: string;
  gamificationPoints?: number;
  contributionCount?: number;
}

class AuthService {
  async signIn(email: string, password: string): Promise<User> {
    const response = await fetch(`${API_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    await AsyncStorage.setItem('userId', data.user.id);
    await AsyncStorage.setItem('userEmail', data.user.email);
    await AsyncStorage.setItem('authToken', data.token);
    
    return data.user;
  }

  async signUp(email: string, password: string, name?: string): Promise<User> {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      throw new Error('Sign up failed');
    }

    const data = await response.json();
    await AsyncStorage.setItem('userId', data.user.id);
    await AsyncStorage.setItem('userEmail', data.user.email);
    await AsyncStorage.setItem('authToken', data.token);
    
    return data.user;
  }

  async signOut(): Promise<void> {
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userEmail');
    await AsyncStorage.removeItem('authToken');
  }

  async getCurrentUser(): Promise<User | null> {
    const userId = await AsyncStorage.getItem('userId');
    const userEmail = await AsyncStorage.getItem('userEmail');
    
    if (!userId || !userEmail) {
      return null;
    }

    return {
      id: userId,
      email: userEmail,
    };
  }

  async isAuthenticated(): Promise<boolean> {
    const userId = await AsyncStorage.getItem('userId');
    return !!userId;
  }
}

export default new AuthService();
