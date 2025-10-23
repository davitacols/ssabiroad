import * as SecureStore from 'expo-secure-store';

let analyticsEnabled = false;

export const initAnalytics = () => {
  analyticsEnabled = true;
  console.log('Analytics initialized');
};

export const logEvent = async (eventName: string, params?: Record<string, any>) => {
  if (!analyticsEnabled) return;
  
  console.log('Analytics Event:', eventName, params);
  
  const event = {
    name: eventName,
    timestamp: new Date().toISOString(),
    params: params || {},
  };
  
  try {
    const stored = await SecureStore.getItemAsync('analytics_events');
    const events = stored ? JSON.parse(stored) : [];
    events.push(event);
    if (events.length > 100) events.shift();
    await SecureStore.setItemAsync('analytics_events', JSON.stringify(events));
  } catch (error) {
    console.error('Analytics storage error:', error);
  }
};

export const logScreenView = (screenName: string) => {
  logEvent('screen_view', { screen_name: screenName });
};

export const logError = (error: string, context?: string) => {
  logEvent('error', { error_message: error, context });
};

export const logScan = (success: boolean, method?: string) => {
  logEvent('location_scan', { success, method });
};

export const logSaveLocation = () => {
  logEvent('save_location');
};

export const logShareLocation = () => {
  logEvent('share_location');
};

export const logClearCache = () => {
  logEvent('clear_cache');
};
