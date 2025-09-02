import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Alert,
  Share,
  Animated,
  TextInput,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationCache } from './LocationCache';

export default function HistoryScreen({ navigation, theme }) {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadHistory();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [searchQuery, history]);

  const loadHistory = async () => {
    try {
      const historyData = await LocationCache.getHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const filterHistory = () => {
    if (!searchQuery.trim()) {
      setFilteredHistory(history);
      return;
    }

    const filtered = history.filter(item => 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredHistory(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const shareLocation = async (item) => {
    try {
      const message = `${item.name || 'Location'}\n${item.address}\n${
        item.location ? `https://maps.google.com/?q=${item.location.latitude},${item.location.longitude}` : ''
      }`;
      
      await Share.share({
        message,
        title: 'Location from Pic2Nav'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const deleteItem = (itemId) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const newHistory = history.filter(item => item.id !== itemId);
            setHistory(newHistory);
            // Update stored history
            await LocationCache.clearHistory();
            for (const item of newHistory) {
              await LocationCache.addToHistory(item);
            }
          }
        }
      ]
    );
  };

  const toggleSelection = (itemId) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const deleteSelected = () => {
    Alert.alert(
      'Delete Selected',
      `Delete ${selectedItems.size} selected locations?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const newHistory = history.filter(item => !selectedItems.has(item.id));
            setHistory(newHistory);
            setSelectedItems(new Set());
            setSelectionMode(false);
            
            // Update stored history
            await LocationCache.clearHistory();
            for (const item of newHistory) {
              await LocationCache.addToHistory(item);
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderHistoryItem = (item, index) => (
    <Animated.View
      key={item.id}
      style={[
        styles.historyItem,
        { backgroundColor: theme.surface },
        selectedItems.has(item.id) && styles.selectedItem,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })
          }]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.itemContent}
        onPress={() => {
          if (selectionMode) {
            toggleSelection(item.id);
          } else {
            // Navigate to location details or map
            if (item.location) {
              const url = `https://maps.google.com/?q=${item.location.latitude},${item.location.longitude}`;
              // Open in maps or navigate to map screen
            }
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            toggleSelection(item.id);
          }
        }}
      >
        {selectionMode && (
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleSelection(item.id)}
          >
            <Ionicons
              name={selectedItems.has(item.id) ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={selectedItems.has(item.id) ? '#10B981' : theme.textSecondary}
            />
          </TouchableOpacity>
        )}

        <View style={styles.locationIcon}>
          <Ionicons name="location" size={20} color="#6366F1" />
        </View>

        <View style={styles.itemInfo}>
          <Text style={[styles.locationName, { color: theme.text }]} numberOfLines={1}>
            {item.name || 'Unknown Location'}
          </Text>
          <Text style={[styles.locationAddress, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.address}
          </Text>
          <View style={styles.itemMeta}>
            <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
              {formatDate(item.timestamp)}
            </Text>
            {item.confidence && (
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>{Math.round(item.confidence * 100)}%</Text>
              </View>
            )}
          </View>
        </View>

        {!selectionMode && (
          <View style={styles.itemActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => shareLocation(item)}
            >
              <Ionicons name="share-outline" size={20} color="#6366F1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deleteItem(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {selectionMode ? `${selectedItems.size} selected` : 'History'}
          </Text>
          {selectionMode ? (
            <View style={styles.selectionActions}>
              <TouchableOpacity onPress={deleteSelected} disabled={selectedItems.size === 0}>
                <Ionicons 
                  name="trash" 
                  size={24} 
                  color={selectedItems.size > 0 ? '#EF4444' : theme.textSecondary} 
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setSelectionMode(false);
                setSelectedItems(new Set());
              }}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setSelectionMode(true)}>
              <Ionicons name="ellipsis-horizontal" size={24} color={theme.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.bg }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search locations..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* History List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {searchQuery ? 'No matching locations' : 'No history yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {searchQuery 
                ? 'Try a different search term' 
                : 'Start scanning photos to build your location history'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {filteredHistory.map(renderHistoryItem)}
          </View>
        )}
      </ScrollView>

      {/* Stats Footer */}
      {history.length > 0 && (
        <View style={[styles.statsFooter, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statsText, { color: theme.textSecondary }]}>
            {history.length} locations • {filteredHistory.length} shown
          </Text>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Clear History',
                'This will delete all location history. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                      await LocationCache.clearHistory();
                      setHistory([]);
                      setFilteredHistory([]);
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  selectionActions: { flexDirection: 'row', gap: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: { flex: 1, fontSize: 16 },
  content: { flex: 1 },
  historyList: { padding: 16, gap: 12 },
  historyItem: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedItem: { borderColor: '#10B981', borderWidth: 2 },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  checkbox: { marginRight: 8 },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99,102,241,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: { flex: 1 },
  locationName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  locationAddress: { fontSize: 14, lineHeight: 18, marginBottom: 8 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timestamp: { fontSize: 12 },
  confidenceBadge: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceText: { fontSize: 11, fontWeight: '600', color: '#10B981' },
  itemActions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  statsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statsText: { fontSize: 12 },
  clearButton: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
});