import streamlit as st
from PIL import Image
from io import BytesIO
import base64
import os
from datetime import date
import tempfile
from streamlit.components.v1 import html

st.set_page_config(page_title="Baseline Prototype", layout="wide")
st.title("Baseline Prototype")

st.markdown("""
**Instructions:**
- Tap **Take Photo** to open the camera.
- You can remove or retake images before submission.
- Fill in the metadata fields before submitting.
""")

# --- Session state ---
if "photos" not in st.session_state:
    st.session_state.photos = []  # base64 images
if "photo_files" not in st.session_state:
    st.session_state.photo_files = []  # temp file paths
if "form_data" not in st.session_state:
    st.session_state.form_data = {"title": "", "date": date.today(), "location": ""}
if "show_camera" not in st.session_state:
    st.session_state.show_camera = False
if "temp_dir" not in st.session_state:
    st.session_state.temp_dir = tempfile.mkdtemp(prefix="captures_")

# --- Metadata form ---
st.subheader("Submission Details")
title = st.text_input("Title", value=st.session_state.form_data["title"])
find_date = st.date_input("Date of Find", value=st.session_state.form_data["date"])
location = st.text_input("Location", value=st.session_state.form_data["location"])
st.session_state.form_data.update({"title": title, "date": find_date, "location": location})

st.markdown("---")

# --- Take photo button ---
if not st.session_state.show_camera:
    if st.button("📸 Take Image"):
        st.session_state.show_camera = True

# --- Hidden textarea to get base64 image from JS ---
captured_base64 = st.text_area("Captured Image Data", value="", height=1, key="img_data")

# --- Process captured image ---
if captured_base64:
    st.session_state.photos.append(captured_base64)

    # Save temp file
    img_bytes = base64.b64decode(captured_base64.split(",",1)[1])
    img = Image.open(BytesIO(img_bytes))
    idx = len(st.session_state.photos)
    temp_path = os.path.join(st.session_state.temp_dir, f"photo_{idx}.jpg")
    img.save(temp_path)
    st.session_state.photo_files.append(temp_path)

    st.session_state.show_camera = False
    st.rerun()

# --- Custom JS camera ---
if st.session_state.show_camera:
    html("""
    <style>
    #camera-container {position:relative; width:100%; height:400px; background:black; border-radius:10px;}
    video {width:100%; height:100%; object-fit:cover; border-radius:10px;}
    #capture {position:absolute; bottom:20px; left:50%; transform:translateX(-50%);
               font-size:32px; padding:15px 25px; border-radius:50%; background:#fff; cursor:pointer;
               box-shadow:0 4px 10px rgba(0,0,0,0.4);}
    </style>
    <div id="camera-container">
        <video id="camera" autoplay playsinline></video>
        <button id="capture">📷</button>
        <canvas id="snapshot" style="display:none;"></canvas>
    </div>

    <script>
    const video = document.getElementById('camera');
    const canvas = document.getElementById('snapshot');
    const textarea = window.parent.document.getElementById('img_data');

    navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}, audio:false})
        .then(stream => video.srcObject = stream)
        .catch(err => alert("Camera error: "+err));

    document.getElementById('capture').onclick = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video,0,0);

        canvas.toBlob(blob => {
            const reader = new FileReader();
            reader.onloadend = () => {
                textarea.value = reader.result;  // write base64 to hidden textarea
            };
            reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.9);

        if(video.srcObject) video.srcObject.getTracks().forEach(t=>t.stop());
    };
    </script>
    """, height=450)

st.markdown("---")

# --- Display captured images ---
if st.session_state.photos:
    st.subheader("Captured Images")
    for idx, img_data in enumerate(st.session_state.photos):
        cols = st.columns([4,1])
        try:
            img = Image.open(BytesIO(base64.b64decode(img_data.split(",",1)[1])))
            with cols[0]:
                st.image(img, caption=f"Image {idx+1}", use_container_width=True)
            with cols[1]:
                if st.button(f"Remove {idx+1}", key=f"remove_{idx}"):
                    st.session_state.photos.pop(idx)
                    # remove temp file
                    if idx < len(st.session_state.photo_files):
                        try:
                            os.remove(st.session_state.photo_files[idx])
                            st.session_state.photo_files.pop(idx)
                        except:
                            pass
                    st.rerun()
        except Exception as e:
            st.error(f"Error displaying image {idx+1}: {str(e)}")
else:
    st.info("No photos yet. Tap **Take Photo** to capture one.")

st.divider()

# --- Submit ---
if st.button("Submit"):
    title_clean = st.session_state.form_data["title"].strip()
    location_clean = st.session_state.form_data["location"].strip()
    find_date_val = st.session_state.form_data["date"]

    if not title_clean or not location_clean:
        st.warning("Please provide a title and location before submitting.")
    elif not st.session_state.photos:
        st.warning("Please capture at least one image before submitting.")
    else:
        folder = f"submissions/{title_clean.replace(' ', '_')}_{find_date_val}"
        os.makedirs(folder, exist_ok=True)
        for i, temp_file in enumerate(st.session_state.photo_files, start=1):
            img = Image.open(temp_file)
            img.save(f"{folder}/photo_{i}.jpg")
        st.success(f"✅ Submission saved in `{folder}`!")
        st.session_state.photos.clear()
        st.session_state.photo_files.clear()
