from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import numpy as np
from datetime import datetime
import io
from PIL import Image

app = Flask(__name__)
CORS(app)

# Global variables
model = None
CLASSES = ['glioma', 'meningioma', 'no_tumor', 'pituitary']

def init_model():
    """Initialize the ML model"""
    global model
    try:
        from tensorflow.keras.models import load_model
        model_path = os.path.join(os.path.dirname(__file__), 'brain_tumor_multiclass_model.h5')
        if os.path.exists(model_path):
            print(f"Loading model from {model_path}")
            model = load_model(model_path)
            print("Model loaded successfully!")
            return True
        else:
            print(f"Error: Model file not found at {model_path}")
            return False
    except Exception as e:
        print(f"Error initializing model: {str(e)}")
        return False

@app.route('/')
def home():
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None
    })

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    scan_type = data.get('scanType', '')
    
    if 'scan' in message.lower():
        response = f"I'll help you analyze the {scan_type} scan. Please upload an image."
    elif 'symptom' in message.lower():
        response = "Could you provide more details about the symptoms you're experiencing?"
    else:
        response = "I'm your medical AI assistant. How can I help you today?"

    return jsonify({
        'response': response,
        'timestamp': datetime.now().strftime('%H:%M')
    })

@app.route('/analyze', methods=['POST'])
def analyze_image():
    if model is None:
        return jsonify({'error': 'Model not initialized'}), 503
        
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
            
        file = request.files['image']
        
        # Read the image file into memory
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize image
        image = image.resize((224, 224))
        
        # Convert to numpy array and preprocess
        img_array = np.array(image)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = img_array / 255.0
        
        # Make prediction
        prediction = model.predict(img_array)
        predicted_class = CLASSES[np.argmax(prediction[0])]
        confidence = float(np.max(prediction[0]))
        
        return jsonify({
            'prediction': predicted_class,
            'confidence': confidence,
            'timestamp': datetime.now().strftime('%H:%M')
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    if init_model():
        app.run(debug=True, port=5000)
    else:
        print("Failed to initialize model. Application not started.")
