#!/bin/zsh

# Check for input arguments
if [ $# -ne 2 ]; then
  echo "Usage: $0 <source_directory> <output_file>"
  exit 1
fi

SOURCE_DIR="$1"
OUTPUT_FILE="$2"

# Temporary files
TMP_ALL_CONTENT=$(mktemp)
TMP_PREFIXES=$(mktemp)
TMP_REST=$(mktemp)

# Process each .rdf file (excluding .rdf.tmp)
find "$SOURCE_DIR" -type f -name '*.rdf' ! -name '*.rdf.tmp' | while read -r FILE; do
  if grep -q 'PRINTING N3 GRAPH' "$FILE"; then
    # This deals with files with errors in them; still outputs duplicate statements though; TODO
    awk '/PRINTING N3 GRAPH/ {found=1; next} found' "$FILE" >> "$TMP_ALL_CONTENT"
  else
    # If no error, just concatenate entire file
    cat "$FILE" >> "$TMP_ALL_CONTENT"
  fi
done

# Extract unique @prefix lines
grep '^@prefix' "$TMP_ALL_CONTENT" | sort | uniq > "$TMP_PREFIXES"

# Extract all other lines
grep -v '^@prefix' "$TMP_ALL_CONTENT" > "$TMP_REST"

# Combine and write to output
cat "$TMP_PREFIXES" "$TMP_REST" > "$OUTPUT_FILE"

# Clean up
rm "$TMP_ALL_CONTENT" "$TMP_PREFIXES" "$TMP_REST"

echo "Processed RDF content written to: $OUTPUT_FILE"
