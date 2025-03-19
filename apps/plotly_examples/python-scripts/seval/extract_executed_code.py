import os
import json
import requests

# Define the path to the JSON file
json_file_path = r"C:\Users\atisjai\dev\interactive_charts_eval\extracted_fields.json"
output_json_file_path = r"C:\Users\atisjai\dev\interactive_charts_eval\extracted_executed_code.json"
context_file_path = r"C:\Users\atisjai\dev\interactive_charts_eval\context_files"

def extract_executed_code():
    os.makedirs(context_file_path, exist_ok=True)

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

    def extract_context_data(obj, extracted):
        if isinstance(obj, dict):
            for key, value in obj.items():
                if key == 'upload_file_paths':
                    for context_file in value:
                        extracted.append(context_file)
                else:
                    extract_context_data(value, extracted)
        elif isinstance(obj, list):
            for item in obj:
                extract_context_data(item, extracted)

    def download_file(file):
        print(f"Downloading file: {file}")
        response = requests.get(file)
        if response.status_code != 200:
            print(f"Failed to download file: {file}")
        
        filename = os.path.basename(file)
        local_file_path = os.path.join(context_file_path, filename)

        # Save the file locally
        with open(local_file_path, 'wb') as file:
            file.write(response.content)

    context_files = []
    extract_context_data(data, context_files)
    print(context_files)
    for file in context_files:
        download_file(file)

    # Extract the executedCode fields
    # extracted_executed_code = []
    # extract_executed_code(data, extracted_executed_code)

    # # Convert the extracted data to JSON format
    # extracted_executed_code_json = json.dumps(extracted_executed_code, indent=4)

    # # Save the result to a new JSON file
    # with open(output_json_file_path, 'w', encoding='utf-8') as file:
    #     file.write(extracted_executed_code_json)

    # print(f"Extracted executedCode fields have been saved to {output_json_file_path}")