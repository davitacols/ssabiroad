import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Share, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

export default function InviteCollaboratorsScreen() {
  const router = useRouter();
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const stored = await AsyncStorage.getItem('collections');
      if (stored) setCollections(JSON.parse(stored));
    } catch (error) {
      console.error('Load collections error:', error);
    }
  };

  const generateInviteLink = (collectionId: string) => {
    return `https://pic2nav.com/collection/${collectionId}`;
  };

  const handleCopyLink = async () => {
    if (!selectedCollection) {
      Alert.alert('Select Collection', 'Please select a collection first');
      return;
    }
    const link = generateInviteLink(selectedCollection.id);
    await Clipboard.setStringAsync(link);
    Alert.alert('Copied!', 'Invite link copied to clipboard');
  };

  const handleShareInvite = async () => {
    if (!selectedCollection) {
      Alert.alert('Select Collection', 'Please select a collection first');
      return;
    }

    const link = generateInviteLink(selectedCollection.id);
    const message = inviteMessage || `Join my "${selectedCollection.name}" collection on Pic2Nav! Add your favorite locations and explore together.`;

    try {
      await Share.share({
        message: `${message}\n\n${link}`,
        title: 'Invite to Collection',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Collaborators</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="people" size={32} color="#6366f1" />
          <Text style={styles.infoTitle}>Collaborate Together</Text>
          <Text style={styles.infoText}>
            Invite friends to add locations to your collection. Everyone can contribute and explore together!
          </Text>
        </View>

        {/* Select Collection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SELECT COLLECTION</Text>
          {collections.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No collections yet</Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => router.push('/collections')}
              >
                <Text style={styles.createButtonText}>Create Collection</Text>
              </TouchableOpacity>
            </View>
          ) : (
            collections.map((collection) => (
              <TouchableOpacity
                key={collection.id}
                style={[
                  styles.collectionCard,
                  selectedCollection?.id === collection.id && styles.collectionCardSelected
                ]}
                onPress={() => setSelectedCollection(collection)}
              >
                <View style={styles.collectionIcon}>
                  <Ionicons 
                    name={selectedCollection?.id === collection.id ? "checkmark-circle" : "folder"} 
                    size={24} 
                    color={selectedCollection?.id === collection.id ? "#6366f1" : "#6b7280"} 
                  />
                </View>
                <View style={styles.collectionInfo}>
                  <Text style={styles.collectionName}>{collection.name}</Text>
                  <Text style={styles.collectionCount}>
                    {collection.locations?.length || 0} locations
                  </Text>
                </View>
                {selectedCollection?.id === collection.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Custom Message */}
        {selectedCollection && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CUSTOM MESSAGE (OPTIONAL)</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Add a personal invitation message..."
              placeholderTextColor="#9ca3af"
              value={inviteMessage}
              onChangeText={setInviteMessage}
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {/* Invite Actions */}
        {selectedCollection && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SHARE INVITE</Text>
            
            <TouchableOpacity style={styles.actionCard} onPress={handleShareInvite}>
              <View style={styles.actionIcon}>
                <Ionicons name="share-social" size={24} color="#ffffff" />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Share Invite Link</Text>
                <Text style={styles.actionDesc}>Send via any app</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleCopyLink}>
              <View style={styles.actionIcon}>
                <Ionicons name="link" size={24} color="#ffffff" />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Copy Link</Text>
                <Text style={styles.actionDesc}>Copy to clipboard</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </TouchableOpacity>

            {/* Quick Share Platforms */}
            <View style={styles.platformsGrid}>
              <TouchableOpacity 
                style={styles.platformCard}
                onPress={async () => {
                  const link = generateInviteLink(selectedCollection.id);
                  const message = inviteMessage || `Join my "${selectedCollection.name}" collection!`;
                  await Share.share({ message: `${message}\n\n${link}` });
                }}
              >
                <View style={[styles.platformIcon, { backgroundColor: '#25D366' }]}>
                  <Ionicons name="logo-whatsapp" size={28} color="#ffffff" />
                </View>
                <Text style={styles.platformName}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.platformCard}
                onPress={async () => {
                  const link = generateInviteLink(selectedCollection.id);
                  const message = inviteMessage || `Join my "${selectedCollection.name}" collection!`;
                  await Share.share({ message: `${message}\n\n${link}` });
                }}
              >
                <View style={[styles.platformIcon, { backgroundColor: '#0084FF' }]}>
                  <Ionicons name="chatbubbles" size={28} color="#ffffff" />
                </View>
                <Text style={styles.platformName}>Messenger</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.platformCard}
                onPress={async () => {
                  const link = generateInviteLink(selectedCollection.id);
                  const subject = encodeURIComponent(`Join my collection on Pic2Nav`);
                  const body = encodeURIComponent(`${inviteMessage || `Join my "${selectedCollection.name}" collection!`}\n\n${link}`);
                  await Share.share({ message: `${inviteMessage || `Join my "${selectedCollection.name}" collection!`}\n\n${link}` });
                }}
              >
                <View style={[styles.platformIcon, { backgroundColor: '#000000' }]}>
                  <Ionicons name="mail" size={28} color="#ffffff" />
                </View>
                <Text style={styles.platformName}>Email</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Preview */}
        {selectedCollection && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>PREVIEW</Text>
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>
                {inviteMessage || `Join my "${selectedCollection.name}" collection on Pic2Nav!`}
              </Text>
              <Text style={styles.previewLink}>
                {generateInviteLink(selectedCollection.id)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#000000',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'LeagueSpartan_700Bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#eef2ff',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginTop: 12,
    marginBottom: 8,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'LeagueSpartan_400Regular',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 12,
    letterSpacing: 1.5,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 16,
    fontFamily: 'LeagueSpartan_400Regular',
  },
  createButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'LeagueSpartan_600SemiBold',
  },
  collectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  collectionCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  collectionIcon: {
    marginRight: 12,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  collectionCount: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'LeagueSpartan_400Regular',
  },
  messageInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#000000',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontFamily: 'LeagueSpartan_400Regular',
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  actionDesc: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'LeagueSpartan_400Regular',
  },
  platformsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  platformCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  platformIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'LeagueSpartan_600SemiBold',
  },
  previewSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewTitle: {
    fontSize: 15,
    color: '#000000',
    marginBottom: 12,
    lineHeight: 22,
    fontFamily: 'LeagueSpartan_400Regular',
  },
  previewLink: {
    fontSize: 13,
    color: '#6366f1',
    fontFamily: 'LeagueSpartan_600SemiBold',
  },
});
