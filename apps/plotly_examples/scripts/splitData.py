import json
import os

# Load the JSON data from a file
with open('parsed_data_with_ids.json', 'r') as file:
    data = json.load(file)

# Create a directory to store the split files
output_dir = 'split_data'
os.makedirs(output_dir, exist_ok=True)

# Split each data entry into a new file
for index, entry in enumerate(data):
    output_file = os.path.join(output_dir, f'data_{index + 1}.json')
    with open(output_file, 'w') as file:
        json.dump(entry, file, indent=2)

print("Data split into separate files successfully.")