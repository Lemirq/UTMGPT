import os
import json
import hashlib

def fingerprint(text, url):
    return hashlib.sha256((text + url).encode("utf-8")).hexdigest()

def clean_text(text):
    text = text.replace('\u0000', '')
    text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\r\t')
    return ' '.join(text.split())

def chunk_text(text, max_words=200):
    text = clean_text(text)
    words = text.split()
    return [" ".join(words[i:i + max_words]) for i in range(0, len(words), max_words)]

def debug_files():
    input_folder = "utm_pages"
    seen_file = "seen.json"

    # Load seen hashes
    if os.path.exists(seen_file):
        with open(seen_file, "r") as f:
            seen_hashes = set(json.load(f))
        print(f"📊 Loaded {len(seen_hashes)} seen hashes")
    else:
        seen_hashes = set()
        print("❌ No seen.json file found")

    # Get all files
    all_filenames = sorted(os.listdir(input_folder))
    total_files = len(all_filenames)
    print(f"📁 Total files: {total_files}")

    # Check files around index 30394
    start_check = 30390
    end_check = 30400

    print(f"\n🔍 Checking files {start_check} to {end_check}:")

    for i in range(start_check, min(end_check, total_files)):
        if i >= len(all_filenames):
            break

        filename = all_filenames[i]
        print(f"\n📄 File {i}: {filename}")

        path = os.path.join(input_folder, filename)

        if not os.path.exists(path):
            print(f"   ❌ File doesn't exist!")
            continue

        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
                lines = content.splitlines()

                if not lines:
                    print(f"   ⚠️  Empty file")
                    continue

                if not lines[0].startswith("URL:"):
                    print(f"   ⚠️  No URL header: {lines[0][:50]}...")
                    continue

                url = lines[0][5:].strip()
                body = "\n".join(lines[2:])

                print(f"   🔗 URL: {url}")
                print(f"   📝 Body length: {len(body)} chars")

                if len(body.strip()) == 0:
                    print(f"   ⚠️  Empty body")
                    continue

                chunks = chunk_text(body)
                print(f"   📦 Generated {len(chunks)} chunks")

                new_chunks = 0
                seen_chunks = 0

                for chunk in chunks:
                    hash_id = fingerprint(chunk, url)
                    if hash_id in seen_hashes:
                        seen_chunks += 1
                    else:
                        new_chunks += 1
                        if new_chunks <= 2:  # Show first 2 new chunks
                            print(f"   ✨ NEW chunk: {chunk[:100]}...")

                print(f"   📊 New: {new_chunks}, Already seen: {seen_chunks}")

        except Exception as e:
            print(f"   ❌ Error reading file: {e}")

    # Check some files beyond the current position
    print(f"\n🔍 Checking files beyond position 30394:")

    check_indices = [30500, 31000, 32000, 33000, 34000]

    for i in check_indices:
        if i >= len(all_filenames):
            print(f"📄 File {i}: Index out of range")
            continue

        filename = all_filenames[i]
        path = os.path.join(input_folder, filename)

        if not os.path.exists(path):
            print(f"📄 File {i}: {filename} - DOESN'T EXIST")
            continue

        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
                lines = content.splitlines()

                if not lines or not lines[0].startswith("URL:"):
                    print(f"📄 File {i}: {filename} - INVALID FORMAT")
                    continue

                url = lines[0][5:].strip()
                body = "\n".join(lines[2:])
                chunks = chunk_text(body)

                new_chunks = 0
                for chunk in chunks:
                    hash_id = fingerprint(chunk, url)
                    if hash_id not in seen_hashes:
                        new_chunks += 1

                print(f"📄 File {i}: {filename} - {len(chunks)} chunks, {new_chunks} new")

        except Exception as e:
            print(f"📄 File {i}: {filename} - ERROR: {e}")

if __name__ == "__main__":
    print("🚀 Starting file diagnostics...")
    debug_files()
