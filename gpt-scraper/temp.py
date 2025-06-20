import os
import re
from urllib.parse import urlparse

DATA_FOLDER = "utm_pages"
SCRAPED_FILE = "scraped_urls.txt"
QUEUE_FILE = "queued_urls.txt"

BASE_DOMAIN = "utm.utoronto.ca"

# Load scraped URLs
with open(SCRAPED_FILE, "r") as f:
    scraped = set(line.strip() for line in f if line.strip())

print(f"Loaded {len(scraped)} scraped URLs")

# Regex to find URLs in plain text (basic)
url_pattern = re.compile(r"https?://[^\s\)\]\}]+", re.IGNORECASE)

new_urls = set()

for filename in os.listdir(DATA_FOLDER):
    path = os.path.join(DATA_FOLDER, filename)
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        if not lines or not lines[0].startswith("URL:"):
            continue
        # Skip first line (URL header) and blank line
        text = "".join(lines[2:])

        found_urls = url_pattern.findall(text)
        for url in found_urls:
            # Normalize and filter URLs to only those under utm.utoronto.ca domain
            parsed = urlparse(url)
            if parsed.netloc.endswith(BASE_DOMAIN):
                # Normalize: remove trailing slash
                norm_url = url.rstrip("/")
                if norm_url not in scraped:
                    new_urls.add(norm_url)

print(f"Found {len(new_urls)} new URLs not yet scraped")

# Save new URLs to queued_urls.txt (overwrite)
with open(QUEUE_FILE, "w") as f:
    for url in sorted(new_urls):
        f.write(url + "\n")

print(f"✅ Wrote {len(new_urls)} new URLs to {QUEUE_FILE}")
