#!/bin/zsh

# File containing the list of class names
NAMES_FILE="schema_names.txt"

# Output directory
OUTPUT_DIR="./schemas"

# Base URL
BASE_URL="https://concepts.datalad.org/s"

# File types to fetch
EXTENSIONS=("shacl.ttl" "owl.ttl")

# Create the output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Read each class name and fetch corresponding content for shacl and owl
while IFS= read -r name || [[ -n "$name" ]]; do
  if [[ -n "$name" ]]; then
    for ext in "${EXTENSIONS[@]}"; do
      url="${BASE_URL}/${name}/unreleased.${ext}"
      output_file="${OUTPUT_DIR}/${name}.${ext}"
      echo "Fetching: $url -> $output_file"
      curl -s "$url" -o "$output_file"
    done
  fi
done < "$NAMES_FILE"

echo "All files downloaded to '$OUTPUT_DIR'"
