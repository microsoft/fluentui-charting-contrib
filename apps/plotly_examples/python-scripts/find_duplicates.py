import os
import json
import hashlib

directory = '../data'

# Check if the directory exists
if not os.path.exists(directory):
    print(f"Directory '{directory}' does not exist.")
    exit(1)

# Function to compute the hash of a JSON file's content
def compute_hash(file_path):
    with open(file_path, 'r') as file:
        content = json.load(file)
        content_str = json.dumps(content, sort_keys=True)
        return hashlib.md5(content_str.encode('utf-8')).hexdigest()

# Dictionary to store the hash and corresponding file paths
hash_dict = {}

# Iterate through the files in the directory
for filename in os.listdir(directory):
    if filename.endswith(".json"):
        file_path = os.path.join(directory, filename)
        try:
            file_hash = compute_hash(file_path)
            if file_hash in hash_dict:
                hash_dict[file_hash].append(file_path)
            else:
                hash_dict[file_hash] = [file_path]
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON from file {filename}: {e}")

# Identify and print duplicate files
duplicates = {hash: paths for hash, paths in hash_dict.items() if len(paths) > 1}

if duplicates:
    print("Duplicate JSON files found:")
    # Count the number of duplicates, print their hashes, paths, and count
    total_duplicates = sum(len(paths) - 1 for paths in duplicates.values())
    for file_hash, paths in duplicates.items():
        print(f"Hash: {file_hash}, Count: {len(paths)}")
        for path in paths[1:]:  # Skip the first file, remove the rest
            print(f"  - {path}")
            # Remove the duplicate file
            os.remove(path)
            print(f"Removed duplicate file: {path}")
    print(f"Total duplicates: {total_duplicates}")
else:
    print("No duplicate JSON files found.")