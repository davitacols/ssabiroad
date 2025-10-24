import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

export default function MenuBar() {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { label: 'Home', route: '/', key: 'home' },
    { label: 'Scanner', route: '/scanner', key: 'scanner' },
    { label: 'AR View', route: '/ar-view', key: 'ar' },
    { label: 'Nearby', route: '/nearby-poi', key: 'nearby' },
    { label: 'Activity', route: '/activity', key: 'activity' },
  ];

  const isActive = (route: string) => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  };

  return (
    <View style={styles.container}>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.menuItem}
          onPress={() => router.push(item.route as any)}
        >
          <View style={[styles.indicator, isActive(item.route) && styles.activeIndicator]} />
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
    paddingBottom: 24,
    paddingTop: 16,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  activeIndicator: {
    backgroundColor: '#000000',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeLabel: {
    color: '#000000',
    fontWeight: '700',
  },
});