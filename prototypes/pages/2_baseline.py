import streamlit as st
from PIL import Image
import os
from datetime import date

st.set_page_config(page_title="Baseline Prototype", layout="wide")
st.title("📸 Baseline Prototype")

st.markdown("""
**Instructions:**
- TODO: ENTER TUTORIAL LIKE OERVONDSTCHECKER
- You can remove or retake images before submission.  
- Please fill in all fields below before submitting.
""")

# --- Initialize session state ---
if "photos" not in st.session_state:
    st.session_state.photos = []
if "camera_key" not in st.session_state:
    st.session_state.camera_key = 0
if "form_data" not in st.session_state:
    st.session_state.form_data = {"title": "", "date": date.today(), "location": ""}

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

# Update session data live
st.session_state.form_data["title"] = title
st.session_state.form_data["date"] = find_date
st.session_state.form_data["location"] = location

# --- Camera Input ---
photo = st.camera_input("Take a picture", key=f"camera_{st.session_state.camera_key}")
if photo:
    st.session_state.photos.append(photo)
    st.success("Image captured!")
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
        # Create base submissions folder
        base_dir = "submissions"
        os.makedirs(base_dir, exist_ok=True)

        # Generate unique folder name for this submission
        folder_name = f"{title.replace(' ', '_')}_{location.replace(' ', '_')}_{find_date}"
        save_dir = os.path.join(base_dir, folder_name)
        os.makedirs(save_dir, exist_ok=True)

        # Save all captured images inside the folder
        for i, img_file in enumerate(st.session_state.photos, start=1):
            img = Image.open(img_file)
            filename = f"img_{i}.jpg"
            filepath = os.path.join(save_dir, filename)
            img.save(filepath)

        st.success(f"✅ Submission '{title}' saved successfully in `{save_dir}`")

        # --- Reset all fields & clear photos ---
        st.session_state.photos.clear()
        st.session_state.camera_key += 1
        st.session_state.form_data = {"title": "", "date": date.today(), "location": ""}

        st.rerun()
