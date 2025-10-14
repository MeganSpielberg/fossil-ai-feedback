from sklearn.cluster import KMeans
import streamlit as st
from PIL import Image
import numpy as np
import cv2
import os
from datetime import date

st.set_page_config(page_title="Post capture feedback prototype", layout="wide")
st.title("📸 Post capture feedback prototype")

st.markdown("""
**Instructions:**
- Take between **3–5 images** for best results.  
- Ensure good lighting, a clean yellow card background, and a sharp image.  
- You can remove or retake images before submission.
""")

# --- Initialize session state ---
if "photos" not in st.session_state:
    st.session_state.photos = []
if "camera_key" not in st.session_state:
    st.session_state.camera_key = 0
if "form_data" not in st.session_state:
    st.session_state.form_data = {"title": "", "date": date.today(), "location": ""}

# --- Quality analysis helper functions ---
def analyze_image_quality(image: Image.Image):
    """
    Analyze fossil image quality: lighting, sharpness, and background uniformity.
    """

    img = np.array(image.convert("RGB"))
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    feedback = []
    metrics = {}

    # --- Lighting: check % of dark/bright pixels ---
    dark_pct = np.mean(gray < 50)
    bright_pct = np.mean(gray > 220)
    metrics['dark_pct'] = round(dark_pct*100,1)
    metrics['bright_pct'] = round(bright_pct*100,1)

    if dark_pct > 0.2:
        feedback.append("⚠️ Many areas are too dark — add more light.")
    else:
        feedback.append("✅ Lighting is adequate.")

    if bright_pct > 0.2:
        feedback.append("⚠️ Overexposed regions detected — reduce glare.")
    else:
        feedback.append("✅ No major overexposure.")

    # --- Sharpness: local Laplacian variance ---
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
    if min_var < 100:
        feedback.append("⚠️ Some regions are blurry — ensure steady focus.")
    else:
        feedback.append("✅ Image is sharp across most regions.")

    # --- Background uniformity using color clustering ---
    # Resize for speed
    small_img = cv2.resize(img, (100,100))
    reshaped = small_img.reshape(-1,3)
    kmeans = KMeans(n_clusters=3, n_init=10, random_state=42)
    labels = kmeans.fit_predict(reshaped)
    counts = np.bincount(labels)
    dominant_pct = counts.max()/counts.sum()
    metrics['dominant_bg_pct'] = round(dominant_pct*100,1)

    if dominant_pct < 0.7:
        feedback.append("⚠️ Background is cluttered — use a uniform surface.")
    else:
        feedback.append("✅ Background appears uniform.")

    return feedback, metrics

# --- Submission metadata fields ---
st.subheader("📝 Submission Details")

title = st.text_input(
    "Title",
    placeholder="e.g., Rock fossil",
    value=st.session_state.form_data["title"],
    key="title_input"
)
find_date = st.date_input(
    "Date of Find",
    value=st.session_state.form_data["date"],
    key="date_input"
)
location = st.text_input(
    "Location",
    placeholder="e.g., City, Country or GPS coordinates",
    value=st.session_state.form_data["location"],
    key="location_input"
)

# Update session data
st.session_state.form_data.update({"title": title, "date": find_date, "location": location})

# --- Camera Input ---
photo = st.camera_input("Take a picture", key=f"camera_{st.session_state.camera_key}")
if photo:
    image = Image.open(photo)
    feedback, metrics = analyze_image_quality(image)

    st.subheader("📊 Image Quality Feedback")
    for line in feedback:
        st.write(line)

    # Display thumbnail
    st.image(image, caption="Captured Image", use_container_width=True)

    # Ask user if they want to keep or retake
    keep = st.button("✅ Keep this photo")
    retake = st.button("🔁 Retake photo")

    if keep:
        st.session_state.photos.append(photo)
        st.success("Image saved to submission!")
        st.session_state.camera_key += 1
        st.rerun()

    elif retake:
        st.session_state.camera_key += 1
        st.rerun()

# --- Display Captured Images ---
if st.session_state.photos:
    st.subheader("📷 Captured Images")
    for idx, img_file in enumerate(st.session_state.photos):
        cols = st.columns([3, 1])
        with cols[0]:
            img = Image.open(img_file)
            st.image(img, caption=f"Image {idx+1}", use_container_width=True)
        with cols[1]:
            if st.button(f"🗑 Remove {idx+1}", key=f"remove_{idx}"):
                st.session_state.photos.pop(idx)
                st.rerun()

# --- Submit Section ---
st.divider()
if st.button("Submit"):
    title = st.session_state.form_data["title"].strip()
    location = st.session_state.form_data["location"].strip()
    find_date = st.session_state.form_data["date"]

    if not title or not location:
        st.warning("⚠️ Please provide a title and location before submitting.")
    elif not st.session_state.photos:
        st.warning("⚠️ Please take at least one image before submitting.")
    else:
        # Create base folder
        base_dir = "submissions"
        os.makedirs(base_dir, exist_ok=True)

        # Folder name
        folder_name = f"{title.replace(' ', '_')}_{location.replace(' ', '_')}_{find_date}"
        save_dir = os.path.join(base_dir, folder_name)
        os.makedirs(save_dir, exist_ok=True)

        # Save images
        for i, img_file in enumerate(st.session_state.photos, start=1):
            img = Image.open(img_file)
            img.save(os.path.join(save_dir, f"img_{i}.jpg"))

        st.success(f"✅ Submission '{title}' saved successfully in `{save_dir}`")

        # Clear state
        st.session_state.photos.clear()
        st.session_state.camera_key += 1
        st.session_state.form_data = {"title": "", "date": date.today(), "location": ""}
        st.rerun()
