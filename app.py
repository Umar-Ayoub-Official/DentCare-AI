from flask import Flask, render_template, request, jsonify
import os, cv2, base64, re
from ultralytics import YOLO
from werkzeug.utils import secure_filename

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER): os.makedirs(UPLOAD_FOLDER)

# Load Models with explicit names
models = {"clinical": None, "xray": None}
try:
    if os.path.exists('models/AlphaDent.pt'):
        models["clinical"] = YOLO('models/AlphaDent.pt')
    if os.path.exists('models/best.pt'):
        models["xray"] = YOLO('models/best.pt')
    print("--- ALL DENTAL MODELS LOADED ---")
except Exception as e:
    print(f"Error loading models: {e}")

@app.route('/')
def home(): return render_template('index.html')

@app.route('/predict/clinical_images')
def clinical_images(): return render_template('predict/Clinical_Image.html')

@app.route('/predict/xray_data')
def xray_data(): return render_template('predict/XRay_data.html')

@app.route('/api/predict', methods=['POST'])
def predict():
    if 'image' not in request.files: return jsonify({'error': 'No image'}), 400
    
    file = request.files['image']
    model_request = request.form.get('type', 'xray') # Defaults to xray if not specified
    
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    # STRICT MODEL SELECTION
    if model_request == 'clinical':
        current_model = models["clinical"]
    else:
        current_model = models["xray"]
    
    if current_model is None:
        return jsonify({'error': 'Model not loaded'}), 500

    results = current_model.predict(source=filepath, conf=0.15)
    
    img_base64 = None
    detections = []
    
    if results and len(results) > 0:
        res = results[0]
        res_plotted = res.plot()
        _, buffer = cv2.imencode('.jpg', res_plotted)
        img_base64 = base64.b64encode(buffer).decode('utf-8')

        # Robust label extraction using verbose and boxes
        if res.boxes is not None and len(res.boxes) > 0:
            for id in res.boxes.cls.int().tolist():
                detections.append(res.names[id])
        
        if len(detections) == 0:
            found_items = re.findall(r'\d+\s+([a-zA-Z\s_]+),?', res.verbose())
            for item in found_items:
                detections.append(item.strip())

    final_labels = [d.replace('_', ' ').title() for d in list(set(detections))]
    
    print(f"--- PREDICTION LOG ---")
    print(f"Target Model: {model_request}")
    print(f"Found Labels: {final_labels}")
    
    if os.path.exists(filepath): os.remove(filepath)
    
    return jsonify({
        "status": "success", 
        "image": img_base64, 
        "detections": final_labels
    })

if __name__ == '__main__':
    app.run(debug=True)