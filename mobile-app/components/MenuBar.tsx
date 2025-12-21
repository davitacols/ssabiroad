import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, getColors } from '../contexts/ThemeContext';

export default function MenuBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = getColors(theme);

  const menuItems = [
    { icon: 'home-outline', activeIcon: 'home', label: 'Home', route: '/', key: 'home' },
    { icon: 'camera-outline', activeIcon: 'camera', label: 'Scanner', route: '/scanner', key: 'scanner' },
    { icon: 'compass-outline', activeIcon: 'compass', label: 'Nearby', route: '/nearby-poi', key: 'nearby' },
    { icon: 'time-outline', activeIcon: 'time', label: 'Activity', route: '/activity', key: 'activity' },
  ];

  const isActive = (route: string) => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  };

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={[styles.container, { paddingBottom: 10, marginBottom: insets.bottom, backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.menuItem}
          onPress={() => handlePress(item.route)}
        >
          <Ionicons 
            name={isActive(item.route) ? item.activeIcon : item.icon} 
            size={24} 
            color={isActive(item.route) ? colors.text : colors.textSecondary}
          />
          <Text style={[styles.label, { color: colors.textSecondary }, isActive(item.route) && { color: colors.text }]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderTopWidth: 1,
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 11,
    fontFamily: 'LeagueSpartan_600SemiBold',
  },
});