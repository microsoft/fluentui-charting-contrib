# python script to add ID for each dataset
import json

# Load the JSON data from a file
with open('parsed_data.json', 'r') as file:
    data = json.load(file)

# Add an id tag to each data entry
for index, entry in enumerate(data):
    entry['id'] = index + 1

# Write the modified data back to a JSON file
with open('parsed_data_with_ids.json', 'w') as file:
    json.dump(data, file, indent=2)

print("IDs added successfully.")