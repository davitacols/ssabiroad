import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np

class LocationEmbedding:
    """Generate location embeddings from images and GPS"""
    
    def __init__(self, embedding_dim=256):
        self.embedding_dim = embedding_dim
        self.model = self.build_model()
    
    def build_model(self):
        """Build multi-modal embedding model"""
        # Image branch
        image_input = layers.Input(shape=(224, 224, 3), name='image')
        base = keras.applications.EfficientNetB0(
            include_top=False,
            weights='imagenet',
            input_tensor=image_input
        )
        base.trainable = False
        
        x = layers.GlobalAveragePooling2D()(base.output)
        image_features = layers.Dense(512, activation='relu')(x)
        
        # GPS branch
        gps_input = layers.Input(shape=(2,), name='gps')  # lat, lon
        gps_features = layers.Dense(64, activation='relu')(gps_input)
        gps_features = layers.Dense(128, activation='relu')(gps_features)
        
        # Combine
        combined = layers.Concatenate()([image_features, gps_features])
        combined = layers.Dense(512, activation='relu')(combined)
        combined = layers.Dropout(0.3)(combined)
        embedding = layers.Dense(self.embedding_dim, activation='linear', name='embedding')(combined)
        
        model = keras.Model(
            inputs=[image_input, gps_input],
            outputs=embedding
        )
        
        return model
    
    def get_embedding(self, image, gps_coords):
        """Get embedding for image and GPS"""
        img = np.expand_dims(image, axis=0)
        gps = np.array([gps_coords])
        return self.model.predict([img, gps], verbose=0)[0]
    
    def compute_similarity(self, emb1, emb2):
        """Compute cosine similarity between embeddings"""
        return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))

if __name__ == '__main__':
    model = LocationEmbedding(embedding_dim=256)
    print("Location embedding model created")
    print(f"Total parameters: {model.model.count_params():,}")
