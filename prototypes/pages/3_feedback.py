import streamlit as st
from PIL import Image
import numpy as np
import cv2
from sklearn.cluster import KMeans
from datetime import date
import os

st.title("Post-capture feedback prototype")

# --- Session state ---
if "photos" not in st.session_state:
    st.session_state.photos = []
if "form_data" not in st.session_state:
    st.session_state.form_data = {"title": "", "date": date.today(), "location": ""}
if "current_photo" not in st.session_state:
    st.session_state.current_photo = None
if "current_metrics" not in st.session_state:
    st.session_state.current_metrics = None
if "camera_key" not in st.session_state:
    st.session_state.camera_key = 0

# --- Fossil quality analysis ---
def analyze_fossil_quality(image: Image.Image):
    img = np.array(image.convert("RGB"))
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    feedback = []
    metrics = {}

    # Lighting
    dark_pct = np.mean(gray < 50)
    bright_pct = np.mean(gray > 220)
    metrics['dark_pct'] = round(dark_pct*100,1)
    metrics['bright_pct'] = round(bright_pct*100,1)
    feedback.append("⚠️ Too dark" if dark_pct > 0.2 else "✅ Lighting OK")
    feedback.append("⚠️ Overexposed" if bright_pct > 0.2 else "✅ No overexposure")

    # Sharpness
    h, w = gray.shape
    patch_size = 100
    min_var = 1e9
    for y in range(0, h, patch_size):
        for x in range(0, w, patch_size):
            patch = gray[y:y+patch_size, x:x+patch_size]
            var = cv2.Laplacian(patch, cv2.CV_64F).var()
            if var < min_var:
                min_var = var
    metrics['min_sharpness'] = round(min_var,1)
    feedback.append("⚠️ Blurry regions" if min_var < 100 else "✅ Sharpness OK")

    # Background uniformity
    small_img = cv2.resize(img, (100,100))
    reshaped = small_img.reshape(-1,3)
    kmeans = KMeans(n_clusters=3, n_init=10, random_state=42)
    labels = kmeans.fit_predict(reshaped)
    counts = np.bincount(labels)
    dominant_pct = counts.max()/counts.sum()
    metrics['dominant_bg_pct'] = round(dominant_pct*100,1)
    feedback.append("⚠️ Cluttered background" if dominant_pct < 0.7 else "✅ Background OK")

    return feedback, metrics

# --- Submission fields ---
st.subheader("Submission Details")
title = st.text_input("Title", value=st.session_state.form_data["title"])
find_date = st.date_input("Date of Find", value=st.session_state.form_data["date"])
location = st.text_input("Location", value=st.session_state.form_data["location"])
st.session_state.form_data.update({"title": title, "date": find_date, "location": location})

# --- Camera input ---
st.subheader("Take Fossil Photos")
st.markdown("""
**Instructions:**  
- Use your phone camera.  
- Ensure good lighting, uniform background, and sharp focus.  
- You can take multiple photos and remove any before submitting.
""")

# Make camera input larger and adaptive
camera_container = st.container()
with camera_container:
    photo = st.camera_input("Capture a photo", key=f"camera_{st.session_state.camera_key}")

if photo:
    image = Image.open(photo)
    st.session_state.current_photo = image
    # Quality feedback
    feedback, metrics = analyze_fossil_quality(image)
    st.session_state.current_metrics = (feedback, metrics)
    # Increment camera key to clear view after capture
    st.session_state.camera_key += 1
    st.rerun()

# Display current photo and metrics if they exist
if st.session_state.current_photo is not None:
    st.image(st.session_state.current_photo, caption="Captured Photo", use_container_width=True)

    if st.session_state.current_metrics:
        feedback, metrics = st.session_state.current_metrics
        st.subheader("Image Quality Feedback")
        for line in feedback:
            st.write(line)
        st.caption(f"Metrics: {metrics}")

    # Keep / discard
    cols = st.columns([1,1])
    if cols[0].button("✅ Keep Photo"):
        st.session_state.photos.append(st.session_state.current_photo)
        st.session_state.current_photo = None
        st.session_state.current_metrics = None
        st.session_state.camera_key += 1  # Ensure camera is clear
        st.success("Photo saved!")
        st.rerun()
    if cols[1].button("🔁 Discard Photo"):
        st.session_state.current_photo = None
        st.session_state.current_metrics = None
        st.session_state.camera_key += 1  # Ensure camera is clear
        st.warning("Photo discarded.")
        st.rerun()

# --- Display saved photos ---
if st.session_state.photos:
    st.subheader("Saved Photos")
    for idx, img in enumerate(st.session_state.photos):
        st.image(img, caption=f"Image {idx+1}", use_container_width=True)
        if st.button(f"🗑 Remove {idx+1}", key=f"remove_{idx}"):
            st.session_state.photos.pop(idx)
            st.rerun()

# --- Submit button ---
if st.button("Submit"):
    if not title or not location:
        st.warning("⚠️ Please provide title and location.")
    elif not st.session_state.photos:
        st.warning("⚠️ Please take at least one photo.")
    else:
        folder_name = f"{title.replace(' ','_')}_{location.replace(' ','_')}_{find_date}"
        os.makedirs("submissions", exist_ok=True)
        save_dir = os.path.join("submissions", folder_name)
        os.makedirs(save_dir, exist_ok=True)
        for i, img in enumerate(st.session_state.photos, start=1):
            img.save(os.path.join(save_dir, f"img_{i}.jpg"))
        st.success(f"✅ Submission saved in `{save_dir}`")

        # Clear state
        st.session_state.photos.clear()
        st.session_state.form_data = {"title":"", "date": date.today(), "location":""}
