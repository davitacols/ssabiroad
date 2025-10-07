import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationResult } from './api';

export interface HistoryItem extends LocationResult {
  id: string;
  timestamp: string;
}

const HISTORY_KEY = 'analysis_history';

export const saveAnalysisResult = async (result: LocationResult): Promise<void> => {
  try {
    const historyItem: HistoryItem = {
      ...result,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    const existing = await getAnalysisHistory();
    const updated = [historyItem, ...existing].slice(0, 50); // Keep last 50 results
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save analysis result:', error);
  }
};

export const getAnalysisHistory = async (): Promise<HistoryItem[]> => {
  try {
    const stored = await AsyncStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load analysis history:', error);
    return [];
  }
};

export const clearAnalysisHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear analysis history:', error);
  }
};