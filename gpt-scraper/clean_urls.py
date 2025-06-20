input_file = "raw_saved_urls.txt"       # Your messy log file
output_file = "cleaned_urls.txt"        # Final clean list of URLs

with open(input_file, "r", encoding="utf-8") as infile, \
     open(output_file, "w", encoding="utf-8") as outfile:
    for line in infile:
        line = line.strip()
        if line.startswith("[") and "Saved:" in line:
            parts = line.split("Saved:")
            if len(parts) == 2:
                url = parts[1].strip()
                outfile.write(url + "\n")

print("✅ Cleaned valid URLs saved to:", output_file)
