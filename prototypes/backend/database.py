from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Helper: upload image to Supabase Storage
def upload_image_to_supabase(file_bytes, filename):
    bucket = "submissions"
    supabase.storage.from_(bucket).upload(filename, file_bytes, {"content-type": "image/jpeg"})
    url = supabase.storage.from_(bucket).get_public_url(filename)
    return url  # url is a string, no .get()
