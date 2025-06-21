import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from time import sleep
from threading import Thread, Lock, current_thread
import threading
from queue import Queue

BASE_URL = "https://www.utm.utoronto.ca"
DOMAIN = urlparse(BASE_URL).netloc
OUTPUT_FOLDER = "utm_pages"
QUEUE_FILE = "queued_urls.txt"
SCRAPED_FILE = "scraped_urls.txt"
CHECKPOINT_FILE = "checkpoint.txt"
THREADS = 24  # Increase for faster crawling

os.makedirs(OUTPUT_FOLDER, exist_ok=True)
print(f"📁 Created/verified output folder: {OUTPUT_FOLDER}")

# Thread-safe data
url_queue = Queue()
visited_lock = Lock()
counter_lock = Lock()

# Load and save
def load_set(filename):
    if not os.path.exists(filename):
        return set()
    with open(filename, "r") as f:
        return set(line.strip() for line in f if line.strip())

def save_set(filename, data_set):
    with open(filename, "w") as f:
        for item in sorted(data_set):
            f.write(item + "\n")

# Shared state
scraped = load_set(SCRAPED_FILE)
queued = load_set(QUEUE_FILE)
queued_set = set()  # Track URLs currently in queue
counter = len(scraped)
session = requests.Session()

print(f"📊 Loaded {len(scraped)} already scraped URLs")
print(f"📊 Loaded {len(queued)} queued URLs")
print(f"📊 Starting counter at: {counter}")

if not queued:
    queued.add(BASE_URL)
    queued.add("https://utm.calendar.utoronto.ca")
    queued.add("https://artsci.calendar.utoronto.ca")
    print(f"🌱 Starting fresh - added base URLs including calendars")

# Load initial queue
for url in queued:
    url_queue.put(url)
    queued_set.add(url)
print(f"🔄 Loaded {url_queue.qsize()} URLs into processing queue")

def is_valid(link):
    link_lower = link.lower()
    parsed = urlparse(link)

    # Allow UTM-specific domains
    is_utm_domain = (parsed.netloc.endswith('.utm.utoronto.ca') or
                     parsed.netloc == 'utm.utoronto.ca')

    # Allow UofT calendar domains for course information
    is_calendar_domain = parsed.netloc in ['artsci.calendar.utoronto.ca', 'calendar.utoronto.ca']

    # For calendar domains, check if it's UTM-related content
    utm_related_calendar = False
    if is_calendar_domain:
        # Check for UTM campus indicators in the URL
        utm_indicators = ['/utm', 'utm.', 'mississauga', 'campus/utm']
        utm_related_calendar = any(indicator in link_lower for indicator in utm_indicators)

        # Also allow course pages that might be relevant to UTM students
        if '/course/' in link_lower:
            utm_related_calendar = True

    return (
        (is_utm_domain or utm_related_calendar)
        and "#" not in link
        and not any(ext in link_lower for ext in [".pdf", ".jpg", ".jpeg", ".png", ".svg", ".zip", ".doc", ".docx", ".mp3", ".csv", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".rtf", ".odt", ".ods", ".odp", ".gif", ".bmp", ".tiff", ".webp", ".ico", ".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm", ".mkv", ".wav", ".flac", ".aac", ".ogg", ".wma", ".m4a", ".tar", ".gz", ".rar", ".7z", ".bz2", ".exe", ".msi", ".dmg", ".deb", ".rpm", ".apk", ".ipa", ".swf", ".fla", ".psd", ".ai", ".eps", ".indd", ".sketch", ".fig", ".xml", ".json", ".yaml", ".yml", ".sql", ".db", ".sqlite", ".mdb", ".accdb", ".log", ".tmp", ".bak", ".old", ".orig", ".backup"])
        and not link_lower.endswith(".pdf")
        and "download?inline" not in link_lower
        and not link_lower.endswith(".doc")
        and ".docx" not in link_lower
        and link.startswith("http")
        and not link.startswith("https://www.utm.utoronto.ca/~w3pkota")
        and not link.startswith("https://www.utm.utoronto.ca/milsteinlab")
        and not link.startswith("http://library.utm.utoronto.ca/calendar-field_date")
        and not link.startswith("https://library.utm.utoronto.ca/calendar-field_date")
        and not link.startswith("http://library.utm.utoronto.ca/book-collection-displays")
        and not link.startswith("http://www.utm.utoronto.ca/mscsm")
        and not link.startswith("https://library2.utm.utoronto.ca")
        # Filter out non-UTM campus content
        and "scarborough" not in link_lower
        and "/utsc" not in link_lower
        and "st-george" not in link_lower
        and "/stg" not in link_lower
    )

def save_state():
    save_set(SCRAPED_FILE, scraped)
    remaining_urls = {url_queue.queue[i] for i in range(url_queue.qsize())}
    save_set(QUEUE_FILE, remaining_urls)
    print(f"💾 Saved state: {len(scraped)} scraped, {len(remaining_urls)} remaining")

def save_checkpoint():
    """Save current stats to checkpoint file"""
    with open(CHECKPOINT_FILE, "w") as f:
        f.write(f"Scraped: {len(scraped)}\n")
        f.write(f"Queue: {url_queue.qsize()}\n")
        f.write(f"Active threads: {threading.active_count()}\n")
        f.write(f"Counter: {counter}\n")
        import time
        f.write(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
    print(f"📋 Checkpoint: {len(scraped)} scraped, {url_queue.qsize()} queued")

def worker():
    global counter
    thread_id = current_thread().name.replace("Worker-", "W")

    while True:
        try:
            url = url_queue.get(timeout=1)  # Add timeout to prevent hanging
        except:
            break

        with visited_lock:
            # Remove from queued set when processing
            queued_set.discard(url)
            if url in scraped:
                url_queue.task_done()
                continue

        try:
            response = session.get(url, timeout=15)  # Increased timeout
            response.raise_for_status()

            # Check content-type header
            content_type = response.headers.get('content-type', '').lower()
            if 'text/html' not in content_type:
                print(f"⚠️ [{thread_id}] Skipping non-HTML content: {content_type}")
                url_queue.task_done()
                continue

        except Exception as e:
            error_msg = "Unknown error"
            if hasattr(e, 'response') and hasattr(e.response, 'status_code'):
                status_code = e.response.status_code
                if status_code == 429:
                    error_msg = f"{status_code} (Too many requests)"
                elif status_code == 403:
                    error_msg = f"{status_code} (Forbidden)"
                elif status_code == 404:
                    error_msg = f"{status_code} (Not found)"
                elif status_code == 500:
                    error_msg = f"{status_code} (Server error)"
                elif status_code == 502:
                    error_msg = f"{status_code} (Bad gateway)"
                elif status_code == 503:
                    error_msg = f"{status_code} (Service unavailable)"
                elif status_code == 504:
                    error_msg = f"{status_code} (Gateway timeout)"
                else:
                    error_msg = f"{status_code} (HTTP error)"
            elif "timeout" in str(e).lower():
                error_msg = "Timeout"
            elif "connection" in str(e).lower():
                error_msg = "Connection error"
            elif "ssl" in str(e).lower():
                error_msg = "SSL error"
            else:
                error_msg = str(e)[:50]  # First 50 chars of error

            print(f"⚠️ [{thread_id}] Failed: {error_msg}")
            url_queue.task_done()
            continue

        try:
            soup = BeautifulSoup(response.text, "html.parser")
            text = soup.get_text(separator="\n", strip=True)

            # Save text file
            with counter_lock:
                file_index = counter
                counter += 1
            filename = os.path.join(OUTPUT_FOLDER, f"{file_index:05d}.txt")
            with open(filename, "w", encoding="utf-8") as f:
                f.write(f"URL: {url}\n\n{text}")
            with visited_lock:
                scraped.add(url)
                # Immediately write to scraped file
                with open(SCRAPED_FILE, "a") as sf:
                    sf.write(url + "\n")

            # Find new links
            links_found = soup.find_all("a", href=True)
            new_links_added = 0
            new_links_to_add = []

            for a in links_found:
                link = urljoin(url, a['href'])
                parsed = urlparse(link)
                # Check if it's a UTM-specific domain or relevant calendar domain
                is_utm_domain = (parsed.netloc.endswith('.utm.utoronto.ca') or
                                 parsed.netloc == 'utm.utoronto.ca')

                is_calendar_domain = parsed.netloc in ['artsci.calendar.utoronto.ca', 'calendar.utoronto.ca']

                if is_utm_domain or is_calendar_domain:
                    # Apply all URL filtering logic here before adding to queue
                    if is_valid(link):
                        with visited_lock:
                            if link not in scraped and link not in queued_set:
                                new_links_to_add.append(link)
                                new_links_added += 1

            # Add new links outside the visited_lock
            for link in new_links_to_add:
                url_queue.put(link)
                with visited_lock:
                    queued_set.add(link)

            # Write to queue file in batch
            if new_links_to_add:
                with open(QUEUE_FILE, "a") as qf:
                    for link in new_links_to_add:
                        qf.write(link + "\n")

            print(f"✅ [{thread_id}] #{file_index} +{new_links_added} links")

            if file_index % 50 == 0:
                with visited_lock:
                    save_state()
                print(f"🎯 Milestone [{file_index}] - Queue: {url_queue.qsize()}")

        except Exception as e:
            print(f"❌ [{thread_id}] Error: {e}")
        finally:
            url_queue.task_done()

        sleep(0.2)  # be polite

# Start threads
print(f"🚀 Starting {THREADS} worker threads...")
threads = []
for i in range(THREADS):
    t = Thread(target=worker, daemon=True, name=f"Worker-{i+1}")
    t.start()
    threads.append(t)

print(f"🚀 Started {THREADS} workers")

print("⏳ Waiting for all workers to complete...")

# Initial checkpoint
save_checkpoint()

# Add periodic status updates and checkpoints
import time
start_time = time.time()
last_status = start_time
last_checkpoint = start_time

try:
    while not url_queue.empty():
        current_time = time.time()

        # Status update every 60 seconds
        if current_time - last_status > 60:
            remaining = url_queue.qsize()
            elapsed = current_time - start_time
            print(f"📊 Queue: {remaining} | Scraped: {len(scraped)} | Time: {elapsed:.0f}s")
            last_status = current_time

        # Checkpoint every 3 minutes (180 seconds)
        if current_time - last_checkpoint > 180:
            save_checkpoint()
            last_checkpoint = current_time

        sleep(1)

    url_queue.join()

except KeyboardInterrupt:
    print("\n🛑 Interrupted by user, saving current state...")
    with visited_lock:
        save_state()
    save_checkpoint()
    print("💾 State and checkpoint saved, exiting...")
    exit(0)

# Final save
print("💾 Performing final state save...")
with visited_lock:
    save_state()
save_checkpoint()

print(f"🎉 Done crawling! Total pages scraped: {len(scraped)}")
print(f"📊 Final stats: {counter} files saved to {OUTPUT_FOLDER}")
