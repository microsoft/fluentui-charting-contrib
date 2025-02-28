# python script to add ID for each dataset
import json
import os
directory = '../data'
index = 0
for filename in os.listdir(directory):
    if filename.endswith(".json"):
        index += 1
        with open(os.path.join(directory, filename), 'r') as file:
            data = json.load(file)

        # Add an id tag to each data entry
        #skip if already present
        if 'id' in data:
            continue
        data['id'] = index

        # Write the modified data back to a JSON file
        with open(os.path.join(directory, filename), 'w') as file:
            json.dump(data, file, indent=2)
print("IDs added successfully.")