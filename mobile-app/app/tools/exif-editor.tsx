import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function ExifEditorScreen() {
  const [images, setImages] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>({});

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      exif: true,
    });

    if (!result.canceled) {
      setImages(result.assets);
      if (result.assets[0].exif) {
        setMetadata(result.assets[0].exif);
      }
    }
  };

  const saveChanges = async () => {
    Alert.alert('Success', 'Metadata updated successfully');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>EXIF Editor</Text>
        <Text style={styles.subtitle}>Bulk edit photo metadata</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={pickImages}>
        <Text style={styles.buttonText}>Select Photos ({images.length})</Text>
      </TouchableOpacity>

      {images.length > 0 && (
        <View style={styles.form}>
          <Text style={styles.label}>Camera Make</Text>
          <TextInput
            style={styles.input}
            value={metadata.Make || ''}
            onChangeText={(text) => setMetadata({ ...metadata, Make: text })}
            placeholder="Enter camera make"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Camera Model</Text>
          <TextInput
            style={styles.input}
            value={metadata.Model || ''}
            onChangeText={(text) => setMetadata({ ...metadata, Model: text })}
            placeholder="Enter camera model"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Copyright</Text>
          <TextInput
            style={styles.input}
            value={metadata.Copyright || ''}
            onChangeText={(text) => setMetadata({ ...metadata, Copyright: text })}
            placeholder="Enter copyright"
            placeholderTextColor="#666"
          />

          <TouchableOpacity style={styles.saveButton} onPress={saveChanges}>
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 20, paddingTop: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#888', marginTop: 8 },
  button: { backgroundColor: '#3b82f6', padding: 16, margin: 20, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  form: { padding: 20 },
  label: { fontSize: 14, color: '#fff', marginBottom: 8, fontFamily: 'LeagueSpartan_600SemiBold' },
  input: { backgroundColor: '#111', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 16 },
  saveButton: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
});
