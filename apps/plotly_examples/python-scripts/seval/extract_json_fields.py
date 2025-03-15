import json

# Define the path to the JSON file
json_file_path = r".\cwc_treatment_conversations.json"
output_json_file_path = r".\extracted_fields.json"

# Read the JSON file
with open(json_file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

# Extract the fields from each object
extracted_data = []
for item in data:
    for key, value in item.items():
        try:
            print('key = ', key)
            # Parse the JSON string
            parsed_value = json.loads(value)
            extracted_data.append(parsed_value)
        except json.JSONDecodeError:
            print(f"Error decoding JSON for key: {key}")
            continue

# Convert the extracted data to JSON format
extracted_data_json = json.dumps(extracted_data, indent=4)

# Save the result to a new JSON file
with open(output_json_file_path, 'w', encoding='utf-8') as file:
    file.write(extracted_data_json)

print(f"Extracted fields have been saved to {output_json_file_path}")