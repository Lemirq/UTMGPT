#!/usr/bin/env python3
# dedupe_queue.py - CLI tool for managing queued URLs

import argparse
import sys

def dedupe_queue():
    """Remove URLs from queue that are already scraped"""
    scraped_file = "scraped_urls.txt"
    queued_file = "queued_urls.txt"

    try:
        # Load scraped URLs into a set
        with open(scraped_file, "r") as f:
            scraped_urls = set(line.strip() for line in f if line.strip())
    except FileNotFoundError:
        print(f"❌ Error: {scraped_file} not found")
        return False

    try:
        # Load queued URLs into a list
        with open(queued_file, "r") as f:
            queued_urls = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"❌ Error: {queued_file} not found")
        return False

    # Remove any queued URLs that are already scraped
    deduped_queue = [url for url in queued_urls if url not in scraped_urls]
    removed_count = len(queued_urls) - len(deduped_queue)

    # Overwrite queued file with clean list
    with open(queued_file, "w") as f:
        for url in deduped_queue:
            f.write(url + "\n")

    print(f"✅ Removed {removed_count} duplicate URLs from queue.")
    print(f"📄 Queue is now {len(deduped_queue)} URLs long.")
    return True

def remove_urls_starting_with(prefix):
    """Remove URLs from queue that start with specific prefix"""
    queued_file = "queued_urls.txt"

    try:
        # Load queued URLs into a list
        with open(queued_file, "r") as f:
            queued_urls = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"❌ Error: {queued_file} not found")
        return False

    # Remove URLs starting with the prefix
    filtered_queue = [url for url in queued_urls if not url.startswith(prefix)]
    removed_count = len(queued_urls) - len(filtered_queue)

    # Overwrite queued file with filtered list
    with open(queued_file, "w") as f:
        for url in filtered_queue:
            f.write(url + "\n")

    print(f"✅ Removed {removed_count} URLs starting with '{prefix}' from queue.")
    print(f"📄 Queue is now {len(filtered_queue)} URLs long.")
    return True

def main():
    parser = argparse.ArgumentParser(description="Manage queued URLs for web crawler")
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Dedupe command
    dedupe_parser = subparsers.add_parser('dedupe', help='Remove already scraped URLs from queue')

    # Remove URLs command
    remove_parser = subparsers.add_parser('remove', help='Remove URLs starting with specific prefix')
    remove_parser.add_argument('prefix', help='URL prefix to remove (e.g., https://example.com/path)')

    args = parser.parse_args()

    if args.command == 'dedupe':
        return dedupe_queue()
    elif args.command == 'remove':
        return remove_urls_starting_with(args.prefix)
    else:
        parser.print_help()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
