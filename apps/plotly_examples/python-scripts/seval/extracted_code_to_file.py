import json
import os

# Define the path to the JSON file
json_file_path = r".\extracted_executed_code_2.json"
output_dir = r".\python_code_files"

# Create the output directory if it doesn't exist
os.makedirs(output_dir, exist_ok=True)

# Read the JSON file
with open(json_file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

# Iterate through each item in the JSON array and write to a separate Python file
for i, code in enumerate(data):
    code_filename = os.path.join(output_dir, f"code_{i+1}.py")
    with open(code_filename, 'w', encoding='utf-8') as code_file:
        code_file.write(code)

print(f"Converted {len(data)} items to Python code files in {output_dir}")