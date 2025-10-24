try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
except ImportError:
    print("TensorFlow not installed. Run: pip install tensorflow")
    raise

import numpy as np
from PIL import Image
import json

class LandmarkClassifier:
    """CNN model for landmark/building classification"""
    
    def __init__(self, num_classes=1000):
        self.num_classes = num_classes
        self.model = self.build_model()
        
    def build_model(self):
        """Build MobileNetV2-based classifier"""
        base_model = keras.applications.MobileNetV2(
            input_shape=(224, 224, 3),
            include_top=False,
            weights='imagenet'
        )
        base_model.trainable = False
        
        model = keras.Sequential([
            base_model,
            layers.GlobalAveragePooling2D(),
            layers.Dropout(0.2),
            layers.Dense(512, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(self.num_classes, activation='softmax')
        ])
        
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy', 'top_k_categorical_accuracy']
        )
        
        return model
    
    def preprocess_image(self, image_path):
        """Preprocess image for model input"""
        img = Image.open(image_path).convert('RGB')
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0
        return np.expand_dims(img_array, axis=0)
    
    def predict(self, image_path, top_k=5):
        """Predict top-k landmarks"""
        img = self.preprocess_image(image_path)
        predictions = self.model.predict(img, verbose=0)
        top_indices = np.argsort(predictions[0])[-top_k:][::-1]
        
        return [
            {
                'class_id': int(idx),
                'confidence': float(predictions[0][idx])
            }
            for idx in top_indices
        ]
    
    def train(self, train_data, val_data, epochs=10):
        """Train the model"""
        history = self.model.fit(
            train_data,
            validation_data=val_data,
            epochs=epochs,
            callbacks=[
                keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True),
                keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=2)
            ]
        )
        return history
    
    def save(self, path):
        """Save model"""
        self.model.save(path)
    
    def load(self, path):
        """Load model"""
        self.model = keras.models.load_model(path)

if __name__ == '__main__':
    try:
        classifier = LandmarkClassifier(num_classes=1000)
        print("Landmark classifier model created")
        print(f"Total parameters: {classifier.model.count_params():,}")
    except Exception as e:
        print(f"Error: {e}")
