import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, TextInput, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, getColors } from '../contexts/ThemeContext';
import MenuBar from '../components/MenuBar';

export default function HelpDeskScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleEmailSupport = () => {
    const subject = encodeURIComponent('Support Request');
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
    Linking.openURL(`mailto:support@pic2nav.com?subject=${subject}&body=${body}`);
  };

  const handleQuickEmail = () => {
    Linking.openURL('mailto:support@pic2nav.com');
  };

  const faqs = [
    {
      question: 'How does location recognition work?',
      answer: 'Our AI analyzes GPS data from your photos to identify locations. Make sure location services are enabled when taking photos.'
    },
    {
      question: 'Why is my photo not being recognized?',
      answer: 'Ensure your photo has GPS metadata. Photos taken with location services disabled won\'t have location data.'
    },
    {
      question: 'How do I save locations?',
      answer: 'After scanning a photo, tap the Save button to add it to your saved locations collection.'
    },
    {
      question: 'Can I use photos from my gallery?',
      answer: 'Yes! Use the "Choose from Gallery" option. The photo must have GPS data embedded.'
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="help-circle" size={48} color="#8b5cf6" />
          <Text style={[styles.heroTitle, { color: colors.text }]}>How can we help?</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Get support via email or browse FAQs</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleQuickEmail}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="mail" size={24} color="#8b5cf6" />
            </View>
            <Text style={[styles.quickActionTitle, { color: colors.text }]}>Email Support</Text>
            <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>support@pic2nav.com</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => Linking.openURL('https://pic2nav.com')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="globe" size={24} color="#3b82f6" />
            </View>
            <Text style={[styles.quickActionTitle, { color: colors.text }]}>Visit Website</Text>
            <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>pic2nav.com</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Send us a message</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Your name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="your@email.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Message</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Describe your issue or question..."
              placeholderTextColor={colors.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: theme === 'dark' ? '#fff' : '#000' }]}
            onPress={handleEmailSupport}
            disabled={!name || !email || !message}
          >
            <Ionicons name="send" size={20} color={theme === 'dark' ? '#000' : '#fff'} />
            <Text style={[styles.sendButtonText, { color: theme === 'dark' ? '#000' : '#fff' }]}>Send Message</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.faqSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
          
          {faqs.map((faq, idx) => (
            <View key={idx} style={[styles.faqItem, { borderBottomColor: colors.border }]}>
              <View style={styles.faqQuestion}>
                <Ionicons name="help-circle-outline" size={20} color="#8b5cf6" />
                <Text style={[styles.faqQuestionText, { color: colors.text }]}>{faq.question}</Text>
              </View>
              <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.answer}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <MenuBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 24, fontFamily: 'LeagueSpartan_700Bold', flex: 1 },
  content: { flex: 1 },
  heroCard: { margin: 20, padding: 32, borderRadius: 20, alignItems: 'center', borderWidth: 1 },
  heroTitle: { fontSize: 24, fontFamily: 'LeagueSpartan_700Bold', marginTop: 16, marginBottom: 8 },
  heroSubtitle: { fontSize: 15, fontFamily: 'LeagueSpartan_400Regular', textAlign: 'center' },
  quickActions: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  quickActionCard: { flex: 1, padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  quickActionIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  quickActionTitle: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', marginBottom: 4 },
  quickActionSubtitle: { fontSize: 12, fontFamily: 'LeagueSpartan_400Regular', textAlign: 'center' },
  section: { marginHorizontal: 20, marginBottom: 20, padding: 20, borderRadius: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 18, fontFamily: 'LeagueSpartan_700Bold', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontFamily: 'LeagueSpartan_600SemiBold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderRadius: 12, padding: 16, fontSize: 15, fontFamily: 'LeagueSpartan_400Regular', borderWidth: 1 },
  textArea: { borderRadius: 12, padding: 16, fontSize: 15, fontFamily: 'LeagueSpartan_400Regular', borderWidth: 1, minHeight: 120 },
  sendButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 12, gap: 8, marginTop: 8 },
  sendButtonText: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  faqSection: { marginHorizontal: 20, marginBottom: 20, padding: 20, borderRadius: 16, borderWidth: 1 },
  faqItem: { paddingVertical: 16, borderBottomWidth: 1 },
  faqQuestion: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  faqQuestionText: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', flex: 1 },
  faqAnswer: { fontSize: 14, fontFamily: 'LeagueSpartan_400Regular', lineHeight: 20, marginLeft: 32 },
  bottomPadding: { height: 100 },
});
