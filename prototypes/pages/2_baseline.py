from io import BytesIO
import streamlit as st
from PIL import Image
import os
from datetime import date
from streamlit_webrtc import webrtc_streamer, VideoTransformerBase, WebRtcMode
import av
import cv2

# Page config removed here to avoid conflicts with top-level config

st.title("Baseline Prototype")

st.markdown("""
**Instructions:**
- Capture fossil photos using your device camera.
- You can remove or retake images before submission.
- Fill in the metadata fields before submitting.
""")

# --- Initialize session state ---
if "photos" not in st.session_state:
    st.session_state.photos = []
if "camera_key" not in st.session_state:
    st.session_state.camera_key = 0
if "form_data" not in st.session_state:
    st.session_state.form_data = {"title": "", "date": date.today(), "location": ""}

# --- Submission metadata fields ---
st.subheader("Submission Details")
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
st.session_state.form_data["title"] = title
st.session_state.form_data["date"] = find_date
st.session_state.form_data["location"] = location

st.markdown("---")

class VideoTransformer(VideoTransformerBase):
    def __init__(self):
        self.frame = None

    def recv(self, frame):
        img = frame.to_ndarray(format="bgr24")
        self.frame = img  # save latest frame
        return av.VideoFrame.from_ndarray(img, format="bgr24")

st.markdown("---")

# Container for camera and capture button
camera_container = st.container()
with camera_container:
    st.subheader("Camera")
    
    st.markdown("""
    <style>
    .camera-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        width: 100%;
    }

    /* Camera stream always scales nicely */
    .camera-container iframe {
        width: 100% !important;
        border-radius: 8px;
    }

    /* Capture button container */
    .capture-button {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
    }

    /* Capture button style */
    .capture-button button {
        min-height: 70px !important;
        font-size: 24px !important;
        width: 100% !important;
    }

    /* Desktop / Tablet: put button to the right */
    @media (min-width: 768px) {
        .camera-container {
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 1rem;
        }
        .capture-button {
            width: auto;
            height: 100%;
            padding-left: 1rem;
        }
        .capture-button button {
            width: 80px !important;
            height: 160px !important;
        }
    }

    /* Landscape mobile (important tweak) */
    @media (max-width: 768px) and (orientation: landscape) {
        .camera-container {
            flex-direction: column-reverse;
        }
    }
    </style>
    """, unsafe_allow_html=True)

    st.markdown('<div class="camera-container">', unsafe_allow_html=True)
    webrtc_ctx = webrtc_streamer(
        key="fossil-camera",
        mode=WebRtcMode.SENDRECV,
        video_transformer_factory=VideoTransformer,
        media_stream_constraints={"video": True, "audio": False},
        async_processing=True,
    )
    st.markdown('<div class="capture-button">', unsafe_allow_html=True)
    if st.button("📸 Capture", use_container_width=True):
        if webrtc_ctx.video_transformer and webrtc_ctx.video_transformer.frame is not None:
            img = webrtc_ctx.video_transformer.frame
            pil_img = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
            buf = BytesIO()
            pil_img.save(buf, format="JPEG")
            st.session_state.photos.append(buf.getvalue())
            st.success("Image captured!")
            st.rerun()
    st.markdown('</div></div>', unsafe_allow_html=True)


    # Quick actions below camera
    st.subheader("Quick Actions")
    if st.button("Clear photos"):
        st.session_state.photos.clear()
        st.rerun()

# --- Display Captured Images full-width for readability ---
if st.session_state.photos:
    st.subheader("Captured Images")
    for idx, img_file in enumerate(st.session_state.photos):
        cols = st.columns([4, 1])
        with cols[0]:
            img = Image.open(img_file)
            st.image(img, caption=f"Image {idx+1}", use_container_width=True)
        with cols[1]:
            if st.button(f"Remove {idx+1}", key=f"remove_{idx}"):
                st.session_state.photos.pop(idx)
                st.rerun()

# --- Submit Section ---
st.divider()
if st.button("Submit"):
    title = st.session_state.form_data["title"].strip()
    location = st.session_state.form_data["location"].strip()
    find_date = st.session_state.form_data["date"]

    if not title or not location:
        st.warning("Please provide a title and location before submitting.")
    elif not st.session_state.photos:
        st.warning("Please take at least one image before submitting.")
    else:
        base_dir = "submissions"
        os.makedirs(base_dir, exist_ok=True)
        folder_name = f"{title.replace(' ', '_')}_{location.replace(' ', '_')}_{find_date}"
        save_dir = os.path.join(base_dir, folder_name)
        os.makedirs(save_dir, exist_ok=True)
        for i, img_file in enumerate(st.session_state.photos, start=1):
            img = Image.open(img_file)
            filename = f"img_{i}.jpg"
            filepath = os.path.join(save_dir, filename)
            img.save(filepath)
        st.success(f"Submission '{title}' saved successfully in `{save_dir}`")
        st.session_state.photos.clear()
        st.session_state.camera_key += 1
        st.session_state.form_data = {"title": "", "date": date.today(), "location": ""}
        st.rerun()