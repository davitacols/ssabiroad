import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { getHistory } from '../../services/api';

export default function HistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.item}>
      {item.image && <Image source={{ uri: item.image }} style={styles.thumbnail} />}
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.address || 'Unknown Location'}</Text>
        <Text style={styles.itemDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No history yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  list: { padding: 16 },
  item: { flexDirection: 'row', backgroundColor: '#111', padding: 12, borderRadius: 12, marginBottom: 12 },
  thumbnail: { width: 60, height: 60, borderRadius: 8 },
  itemContent: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  itemDate: { fontSize: 12, color: '#888', marginTop: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: '#888' },
});
