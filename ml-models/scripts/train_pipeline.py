import tensorflow as tf
import numpy as np
from pathlib import Path
import json
from landmark_classifier import LandmarkClassifier
from gps_predictor import GPSPredictor

class TrainingPipeline:
    """Pipeline for training location recognition models"""
    
    def __init__(self, data_dir):
        self.data_dir = Path(data_dir)
        self.landmark_model = LandmarkClassifier()
        self.gps_model = GPSPredictor()
    
    def load_dataset(self, split='train'):
        """Load and preprocess dataset"""
        # Expected structure: data_dir/split/class_name/image.jpg
        data_path = self.data_dir / split
        
        images = []
        labels = []
        gps_coords = []
        
        for class_dir in data_path.iterdir():
            if not class_dir.is_dir():
                continue
            
            class_id = int(class_dir.name)
            
            for img_path in class_dir.glob('*.jpg'):
                # Load metadata
                meta_path = img_path.with_suffix('.json')
                if meta_path.exists():
                    with open(meta_path) as f:
                        meta = json.load(f)
                    
                    images.append(str(img_path))
                    labels.append(class_id)
                    gps_coords.append([
                        meta.get('latitude', 0),
                        meta.get('longitude', 0)
                    ])
        
        return images, labels, gps_coords
    
    def create_tf_dataset(self, images, labels, gps_coords, batch_size=32):
        """Create TensorFlow dataset"""
        def load_image(path):
            img = tf.io.read_file(path)
            img = tf.image.decode_jpeg(img, channels=3)
            img = tf.image.resize(img, [224, 224])
            img = img / 255.0
            return img
        
        dataset = tf.data.Dataset.from_tensor_slices((images, labels, gps_coords))
        dataset = dataset.map(
            lambda x, y, z: (load_image(x), y, z),
            num_parallel_calls=tf.data.AUTOTUNE
        )
        dataset = dataset.batch(batch_size)
        dataset = dataset.prefetch(tf.data.AUTOTUNE)
        
        return dataset
    
    def train_landmark_classifier(self, epochs=10):
        """Train landmark classification model"""
        print("Loading training data...")
        train_imgs, train_labels, _ = self.load_dataset('train')
        val_imgs, val_labels, _ = self.load_dataset('val')
        
        print(f"Training samples: {len(train_imgs)}")
        print(f"Validation samples: {len(val_imgs)}")
        
        train_ds = self.create_tf_dataset(train_imgs, train_labels, [[0,0]]*len(train_imgs))
        val_ds = self.create_tf_dataset(val_imgs, val_labels, [[0,0]]*len(val_imgs))
        
        print("Training landmark classifier...")
        history = self.landmark_model.train(train_ds, val_ds, epochs=epochs)
        
        # Save model
        self.landmark_model.save('models/landmark_classifier.h5')
        print("Model saved to models/landmark_classifier.h5")
        
        return history
    
    def train_gps_predictor(self, epochs=10):
        """Train GPS prediction model"""
        print("Loading training data...")
        train_imgs, _, train_gps = self.load_dataset('train')
        val_imgs, _, val_gps = self.load_dataset('val')
        
        train_ds = self.create_tf_dataset(train_imgs, [0]*len(train_imgs), train_gps)
        val_ds = self.create_tf_dataset(val_imgs, [0]*len(val_imgs), val_gps)
        
        print("Training GPS predictor...")
        history = self.gps_model.model.fit(
            train_ds.map(lambda x, y, z: (x, z)),
            validation_data=val_ds.map(lambda x, y, z: (x, z)),
            epochs=epochs,
            callbacks=[
                tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True),
                tf.keras.callbacks.ModelCheckpoint('models/gps_predictor.h5', save_best_only=True)
            ]
        )
        
        print("Model saved to models/gps_predictor.h5")
        return history

if __name__ == '__main__':
    # Example usage
    pipeline = TrainingPipeline('data/locations')
    
    print("Starting training pipeline...")
    print("1. Training landmark classifier...")
    # pipeline.train_landmark_classifier(epochs=10)
    
    print("2. Training GPS predictor...")
    # pipeline.train_gps_predictor(epochs=10)
    
    print("Training complete!")
