import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MenuBar() {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { icon: 'home-outline', activeIcon: 'home', label: 'Home', route: '/', key: 'home' },
    { icon: 'camera-outline', activeIcon: 'camera', label: 'Scanner', route: '/scanner', key: 'scanner' },
    { icon: 'location-outline', activeIcon: 'location', label: 'Geofence', route: '/geofence', key: 'geofence' },
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
    <View style={styles.container}>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.menuItem}
          onPress={() => handlePress(item.route)}
        >
          <Ionicons 
            name={isActive(item.route) ? item.activeIcon : item.icon} 
            size={24} 
            color={isActive(item.route) ? '#000000' : '#9ca3af'}
          />
          <Text style={[styles.label, isActive(item.route) && styles.activeLabel]}>
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
    backgroundColor: '#ffffff',
    paddingBottom: 20,
    paddingTop: 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },

  label: {
    fontSize: 11,
    fontFamily: 'LeagueSpartan_600SemiBold',
    color: '#6b7280',
  },
  activeLabel: {
    color: '#000000',
    fontFamily: 'LeagueSpartan_600SemiBold',
  },
});