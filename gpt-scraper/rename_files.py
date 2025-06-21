import os
import re

def rename_files_to_6_digits():
    folder = "utm_pages"

    if not os.path.exists(folder):
        print(f"❌ Folder '{folder}' does not exist!")
        return

    files = os.listdir(folder)
    txt_files = [f for f in files if f.endswith('.txt')]

    if not txt_files:
        print(f"❌ No .txt files found in '{folder}'!")
        return

    print(f"📁 Found {len(txt_files)} .txt files in '{folder}'")

    renamed_count = 0

    # Sort files to process them in order
    txt_files.sort()

    for filename in txt_files:
        # Extract the number from the filename (assuming format like "123.txt" or "00123.txt")
        match = re.match(r'(\d+)\.txt$', filename)
        if not match:
            print(f"⚠️  Skipping '{filename}' - doesn't match expected format")
            continue

        number = int(match.group(1))

        # Create new filename with 6-digit zero padding
        new_filename = f"{number:06d}.txt"

        # Skip if already in correct format
        if filename == new_filename:
            continue

        old_path = os.path.join(folder, filename)
        new_path = os.path.join(folder, new_filename)

        # Check if target filename already exists
        if os.path.exists(new_path):
            print(f"⚠️  Skipping '{filename}' - target '{new_filename}' already exists")
            continue

        try:
            os.rename(old_path, new_path)
            print(f"✅ Renamed '{filename}' → '{new_filename}'")
            renamed_count += 1
        except Exception as e:
            print(f"❌ Error renaming '{filename}': {e}")

    print(f"\n🎉 Done! Renamed {renamed_count} files to 6-digit format")

if __name__ == "__main__":
    print("🚀 Starting file renaming process...")
    rename_files_to_6_digits()
