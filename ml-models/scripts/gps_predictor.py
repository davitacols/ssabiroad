import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np

class GPSPredictor:
    """Predict GPS coordinates from images"""
    
    def __init__(self):
        self.model = self.build_model()
    
    def build_model(self):
        """Build GPS regression model"""
        base_model = keras.applications.ResNet50V2(
            include_top=False,
            weights='imagenet',
            input_shape=(224, 224, 3)
        )
        base_model.trainable = False
        
        model = keras.Sequential([
            base_model,
            layers.GlobalAveragePooling2D(),
            layers.Dense(1024, activation='relu'),
            layers.Dropout(0.3),
            layers.Dense(512, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(256, activation='relu'),
            layers.Dense(2, activation='linear')  # lat, lon
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        return model
    
    def predict_gps(self, image):
        """Predict GPS coordinates"""
        img = np.expand_dims(image, axis=0)
        coords = self.model.predict(img, verbose=0)[0]
        return {
            'latitude': float(coords[0]),
            'longitude': float(coords[1])
        }
    
    def calculate_distance_error(self, pred_coords, true_coords):
        """Calculate distance error in km"""
        from geopy.distance import geodesic
        return geodesic(
            (pred_coords['latitude'], pred_coords['longitude']),
            (true_coords['latitude'], true_coords['longitude'])
        ).km

if __name__ == '__main__':
    predictor = GPSPredictor()
    print("GPS predictor model created")
    print(f"Total parameters: {predictor.model.count_params():,}")
