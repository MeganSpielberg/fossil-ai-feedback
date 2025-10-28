from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)
cors = CORS(app, origins="*")

SUBMISSIONS_FOLDER = 'prototypes/backend/submissions'
os.makedirs(SUBMISSIONS_FOLDER, exist_ok=True)

@app.route('/api/images', methods=['GET'])
def get_images():
    # List all submissions
    submissions = []
    if os.path.exists(SUBMISSIONS_FOLDER):
        for folder in os.listdir(SUBMISSIONS_FOLDER):
            folder_path = os.path.join(SUBMISSIONS_FOLDER, folder)
            if os.path.isdir(folder_path):
                submissions.append(folder)
    return jsonify({"submissions": submissions})

@app.route('/api/submit', methods=['POST'])
def submit_images():
    try:
        submission_id = request.form.get('submission_id')
        title = request.form.get('title')
        location = request.form.get('location')
        prototype = request.form.get('prototype')
        
        if not all([submission_id, title, location, prototype]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Create submission folder
        submission_folder = os.path.join(SUBMISSIONS_FOLDER, submission_id)
        os.makedirs(submission_folder, exist_ok=True)
        
        # Save submission details
        details = {
            "title": title,
            "location": location,
            "prototype": prototype,
            "date": datetime.now().isoformat(),
            "submission_id": submission_id
        }
        
        details_path = os.path.join(submission_folder, 'details.json')
        with open(details_path, 'w') as f:
            json.dump(details, f, indent=2)
        
        # Save images
        images = request.files.getlist('images')
        saved_count = 0
        
        for idx, image in enumerate(images):
            if image:
                # Generate filename: title_date_prototype_number.jpg
                date_str = datetime.now().strftime('%Y%m%d_%H%M%S')
                safe_title = secure_filename(title.replace(' ', '_'))
                filename = f"{safe_title}_{date_str}_{prototype}_{idx+1}.jpg"
                
                filepath = os.path.join(submission_folder, filename)
                image.save(filepath)
                saved_count += 1
        
        return jsonify({
            "success": True,
            "submission_id": submission_id,
            "images_saved": saved_count,
            "folder": submission_folder
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)