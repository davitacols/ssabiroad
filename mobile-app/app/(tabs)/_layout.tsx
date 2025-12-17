import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { display: 'none' },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scanner',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <Text style={{ fontSize: focused ? 26 : 24 }}>📷</Text>,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => <Text style={{ fontSize: focused ? 26 : 24 }}>📜</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => <Text style={{ fontSize: focused ? 26 : 24 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}
