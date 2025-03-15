import json

# Define the path to the JSON file
json_file_path = r".\extracted_fields.json"
output_json_file_path = r".\extracted_executed_code.json"

# Read the JSON file
with open(json_file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

# Function to recursively extract executedCode fields
def extract_executed_code(obj, extracted):
    if isinstance(obj, dict):
        for key, value in obj.items():
            print(key)
            if key == 'filtered_search' or key == 'turn_memory':
                extracted.append(value)
            else:
                extract_executed_code(value, extracted)
    elif isinstance(obj, list):
        for item in obj:
            extract_executed_code(item, extracted)

# Extract the executedCode fields
extracted_executed_code = []
extract_executed_code(data, extracted_executed_code)

# Convert the extracted data to JSON format
extracted_executed_code_json = json.dumps(extracted_executed_code, indent=4)

# Save the result to a new JSON file
with open(output_json_file_path, 'w', encoding='utf-8') as file:
    file.write(extracted_executed_code_json)

print(f"Extracted executedCode fields have been saved to {output_json_file_path}")