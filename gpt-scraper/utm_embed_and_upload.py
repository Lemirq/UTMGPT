import os
import json
import hashlib
import uuid
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from supabase import create_client
from time import sleep

# Load environment variables
load_dotenv()
SUPABASE_URL: str = os.getenv("SUPABASE_URL")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

model = SentenceTransformer("all-MiniLM-L6-v2")
input_folder = "utm_pages"
CHUNK_SIZE = 200
seen_file = "seen.json"
BATCH_EMBED = 32
BATCH_UPLOAD = 50
FILES_PER_PASS = 2500

print("🚀 Starting vectorization pipeline...")

# Load or initialize seen cache
if os.path.exists(seen_file):
    with open(seen_file, "r") as f:
        seen_hashes = set(json.load(f))
else:
    seen_hashes = set()

def clean_text(text):
    text = text.replace('\u0000', '')
    text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\r\t')
    return ' '.join(text.split())

def chunk_text(text, max_words=CHUNK_SIZE):
    text = clean_text(text)
    words = text.split()
    return [" ".join(words[i:i + max_words]) for i in range(0, len(words), max_words)]

def fingerprint(text, url):
    return hashlib.sha256((text + url).encode("utf-8")).hexdigest()

def save_seen():
    with open(seen_file, "w") as f:
        json.dump(list(seen_hashes), f)

# Get ALL files, sort them for consistent ordering
all_filenames = sorted(os.listdir(input_folder))
total_files = len(all_filenames)
start_idx = 0

uploaded_total = 0

while start_idx < total_files:
    new_chunks = []
    batch_files = all_filenames[start_idx:start_idx + FILES_PER_PASS]

    if not batch_files:
        break

    print(f"\n📦 Processing batch: files {start_idx + 1}–{start_idx + len(batch_files)} of {total_files}")

    for file_idx, filename in enumerate(batch_files, start=start_idx + 1):
        print(f"📄 File {file_idx}/{total_files}: {filename}")
        path = os.path.join(input_folder, filename)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            lines = content.splitlines()
            if not lines or not lines[0].startswith("URL:"):
                continue
            url = lines[0][5:].strip()
            body = "\n".join(lines[2:])
            for chunk in chunk_text(body):
                hash_id = fingerprint(chunk, url)
                if hash_id not in seen_hashes:
                    new_chunks.append((chunk, url, hash_id))

    print(f"✅ {len(new_chunks)} new chunks to embed and upload...")

    if not new_chunks:
        print("🟡 No new data found in this batch. Moving to next batch...\n")
        start_idx += FILES_PER_PASS
        continue

    # Step 2: Embed & Upload
    batch_embed, batch_hashes, batch_urls = [], [], []
    uploaded_count = 0

    for chunk, url, hash_id in new_chunks:
        batch_embed.append(chunk)
        batch_hashes.append(hash_id)
        batch_urls.append(url)

        if len(batch_embed) >= BATCH_EMBED:
            try:
                vectors = model.encode(batch_embed, batch_size=BATCH_EMBED, show_progress_bar=False)
                upload_batch = []
                for i in range(len(batch_embed)):
                    upload_batch.append({
                        "id": str(uuid.uuid4()),
                        "content": batch_embed[i],
                        "url": batch_urls[i],
                        "embedding": vectors[i].tolist()
                    })
                    seen_hashes.add(batch_hashes[i])

                for i in range(0, len(upload_batch), BATCH_UPLOAD):
                    sub_batch = upload_batch[i:i + BATCH_UPLOAD]
                    supabase.table("utmgpt_chunks").insert(sub_batch).execute()
                    uploaded_count += len(sub_batch)
                    uploaded_total += len(sub_batch)
                    print(f"⬆️ Uploaded {uploaded_total} total chunks")

                batch_embed.clear()
                batch_hashes.clear()
                batch_urls.clear()

                if uploaded_total % 100 == 0:
                    save_seen()

            except Exception as e:
                print(f"⚠️ Error during batch upload: {e}")
                sleep(1)
                continue

    # Upload any leftovers
    if batch_embed:
        try:
            vectors = model.encode(batch_embed, batch_size=BATCH_EMBED, show_progress_bar=False)
            upload_batch = [{
                "id": str(uuid.uuid4()),
                "content": batch_embed[i],
                "url": batch_urls[i],
                "embedding": vectors[i].tolist()
            } for i in range(len(batch_embed))]

            for i in range(0, len(upload_batch), BATCH_UPLOAD):
                sub_batch = upload_batch[i:i + BATCH_UPLOAD]
                supabase.table("utmgpt_chunks").insert(sub_batch).execute()
                uploaded_count += len(sub_batch)
                uploaded_total += len(sub_batch)
                print(f"⬆️ Uploaded {uploaded_total} total chunks")

            for hash_id in batch_hashes:
                seen_hashes.add(hash_id)

        except Exception as e:
            print(f"⚠️ Error during final batch upload: {e}")

    save_seen()
    start_idx += FILES_PER_PASS

print(f"\n🎉 All done. Total chunks uploaded: {uploaded_total}")
