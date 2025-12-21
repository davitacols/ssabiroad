import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useTheme, getColors } from '../contexts/ThemeContext';
import MenuBar from './MenuBar';

interface ScreenLayoutProps {
  children: React.ReactNode;
  showMenuBar?: boolean;
}

export default function ScreenLayout({ children, showMenuBar = true }: ScreenLayoutProps) {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={styles.content}>
        {children}
      </View>
      {showMenuBar && <MenuBar />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});
