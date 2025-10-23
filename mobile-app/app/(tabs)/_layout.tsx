import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1c1917',
        tabBarInactiveTintColor: '#a8a29e',
        tabBarStyle: { 
          backgroundColor: '#fafaf9',
          borderTopWidth: 1,
          borderTopColor: '#e7e5e4',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: { backgroundColor: '#fafaf9' },
        headerTintColor: '#1c1917',
        headerShadowVisible: false,
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
        name="tools"
        options={{
          title: 'Tools',
          tabBarIcon: ({ color, focused }) => <Text style={{ fontSize: focused ? 26 : 24 }}>🛠️</Text>,
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
