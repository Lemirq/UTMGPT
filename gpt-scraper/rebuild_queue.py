import os

# Folders and file paths
DATA_FOLDER = "utm_pages"
SCRAPED_FILE = "scraped_urls.txt"
QUEUE_FILE = "queued_urls.txt"

# Load scraped URLs
scraped = set()
if os.path.exists(SCRAPED_FILE):
    with open(SCRAPED_FILE, "r") as f:
        scraped = set(line.strip() for line in f if line.strip())

# Extract URLs from utm_pages/
discovered = set()

for filename in os.listdir(DATA_FOLDER):
    path = os.path.join(DATA_FOLDER, filename)
    with open(path, "r", encoding="utf-8") as f:
        first_line = f.readline()
        if first_line.startswith("URL:"):
            url = first_line[5:].strip()
            if url and url not in scraped:
                discovered.add(url)

# Optional: Add seed roots if you want to restart crawling from high-level pages
seed_urls = [
    "https://www.utm.utoronto.ca",
    "https://www.utm.utoronto.ca/future-students",
    "https://www.utm.utoronto.ca/current-students",
    "https://www.utm.utoronto.ca/about-utm"
]
for seed in seed_urls:
    if seed not in scraped:
        discovered.add(seed)

# Save to queued_urls.txt
with open(QUEUE_FILE, "w") as f:
    for url in sorted(discovered):
        f.write(url + "\n")

print(f"✅ Rebuilt queue with {len(discovered)} starting URLs.")
