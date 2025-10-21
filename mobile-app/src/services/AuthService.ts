import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://ssabiroad.vercel.app/api';

export class AuthService {
  static async signIn(email: string, password: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signin`, {
        email,
        password,
      });

      if (response.data.token) {
        await SecureStore.setItemAsync('authToken', response.data.token);
        await SecureStore.setItemAsync('userData', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw new Error('Sign in failed');
    }
  }

  static async signUp(name: string, email: string, password: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
        name,
        email,
        password,
      });

      if (response.data.token) {
        await SecureStore.setItemAsync('authToken', response.data.token);
        await SecureStore.setItemAsync('userData', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw new Error('Sign up failed');
    }
  }

  static async signOut() {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('userData');
  }

  static async getCurrentUser() {
    try {
      const userData = await SecureStore.getItemAsync('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('authToken');
    return !!token;
  }

  static async getAuthToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('authToken');
  }
}