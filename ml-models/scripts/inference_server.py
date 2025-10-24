try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
except ImportError:
    print("Flask not installed. Run: pip install flask flask-cors")
    raise
from ensemble_predictor import EnsembleLocationPredictor
from PIL import Image
import numpy as np
import io

app = Flask(__name__)
CORS(app)

# Initialize predictor
predictor = EnsembleLocationPredictor()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get image from request
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['image']
        image = Image.open(io.BytesIO(file.read())).convert('RGB')
        image = image.resize((224, 224))
        image_array = np.array(image) / 255.0
        
        # Get GPS hint if provided
        gps_hint = None
        if 'latitude' in request.form and 'longitude' in request.form:
            gps_hint = {
                'latitude': float(request.form['latitude']),
                'longitude': float(request.form['longitude'])
            }
        
        # Predict
        result = predictor.predict_location(image_array, gps_hint)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/add_location', methods=['POST'])
def add_location():
    try:
        file = request.files['image']
        image = Image.open(io.BytesIO(file.read())).convert('RGB')
        image = image.resize((224, 224))
        image_array = np.array(image) / 255.0
        
        location_id = request.form['location_id']
        gps = {
            'latitude': float(request.form['latitude']),
            'longitude': float(request.form['longitude'])
        }
        metadata = {
            'name': request.form.get('name', 'Unknown'),
            'type': request.form.get('type', 'unknown')
        }
        
        predictor.add_to_database(location_id, image_array, gps, metadata)
        
        return jsonify({'success': True, 'location_id': location_id})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Loading models...")
    try:
        predictor.load_models('models/landmark_classifier.h5', 'models/gps_predictor.h5')
        print("Models loaded successfully")
    except:
        print("Warning: Could not load models. Using untrained models.")
    
    print("\n" + "="*50)
    print("ML Inference Server Ready")
    print("="*50)
    print("Endpoints:")
    print("  POST /predict - Predict location from image")
    print("  POST /add_location - Add location to database")
    print("  GET /health - Health check")
    print("="*50 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=False)
