import os
import re
import json
import shutil
import subprocess

# Step 1: Extract or keep code
def extract_or_keep_code(directory_path, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    for filename in os.listdir(directory_path):
        file_path = os.path.join(directory_path, filename)
        if os.path.isfile(file_path) and filename.endswith(".py"):
            output_file_path = os.path.join(output_dir, f"extracted_{filename}")
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
            python_code_blocks = re.findall(r'```python\n(.*?)```', content, re.DOTALL)
            extracted_code = "\n\n".join(python_code_blocks) if python_code_blocks else content
            with open(output_file_path, 'w', encoding='utf-8') as output_file:
                output_file.write(extracted_code)
            print(f"Processed {filename} -> {output_file_path}")

# Step 2: Execute Python files
def execute_python_files(directory):
    for filename in os.listdir(directory):
        if filename.endswith(".py"):
            new_dir = os.path.join(directory, filename.replace('.py', ''))
            os.makedirs(new_dir, exist_ok=True)
            old_filepath = os.path.join(directory, filename)
            new_filepath = os.path.join(new_dir, filename)
            shutil.copy(old_filepath, new_filepath)
            os.chdir(new_dir)
            print(f"Executing: {new_filepath}")
            try:
                subprocess.run(["python", new_filepath], check=True)
            except subprocess.CalledProcessError as e:
                print(f"Error occurred while executing {new_filepath}: {e}")
            os.chdir(directory)

def get_existing_numbers(directory, prefix="data_", extension=".json"):
    existing_numbers = []
    for file in os.listdir(directory):
        if file.startswith(prefix) and file.endswith(extension):
            try:
                match = re.match(rf"{prefix}(\d+)", file)
                if match:
                    number = int(match.group(1))
                    existing_numbers.append(number)
            except ValueError:
                continue
    return existing_numbers

# Step 4: Add ID to JSON files
def add_id(directory):
    for filename in os.listdir(directory):
        if filename.endswith(".json"):
            index = filename.split('_')[1].split('.')[0]
            with open(os.path.join(directory, filename), 'r') as file:
                data = json.load(file)
            if 'id' in data:
                continue
            print(f"Adding ID {index} to {filename}")
            data['id'] = index
            with open(os.path.join(directory, filename), 'w') as file:
                json.dump(data, file, indent=2)
    print("IDs added successfully.")

# Step 5: Copy JSON files to destination
def copy_json_files(source_directory, destination_directory):
    os.makedirs(destination_directory, exist_ok=True)
    for filename in os.listdir(source_directory):
        print(f"Processing file: {filename}")
        if filename.endswith(".json"):
            source_file_path = os.path.join(source_directory, filename)
            print(f"Copying {source_file_path}")
            destination_file_path = os.path.join(destination_directory, filename)
            shutil.copy(source_file_path, destination_file_path)
            print(f"Copied {source_file_path} to {destination_file_path}")
            os.remove(source_file_path)
            print(f"Deleted {source_file_path}")
    os.rmdir(source_directory)
    
# Step 3: Extract, parse and save json data 
def extract_and_save_json(input_directory, output_directory, data_directory, category_file_path):
    data_numbers = get_existing_numbers(data_directory)
    if data_numbers:
        index = max(data_numbers) + 1
    # Ensure the output directory exists
    os.makedirs(output_directory, exist_ok=True)
    excluded_keys = ["data", "id", "layout", "selectedLegends", "frames"]

    with open(category_file_path, "r", encoding="utf-8") as file:
        chart_category = json.load(file)
    # Iterate through all folders and subfolders
    for root, _, files in os.walk(input_directory):
        for filename in files:
            if filename.endswith(".json"):  # Process only JSON files
                filepath = os.path.join(root, filename)
                file_processed = False

                # Read the JSON content
                with open(filepath, 'r', encoding='utf-8') as file:
                    try:
                        data = json.load(file)
                    except json.JSONDecodeError as e:
                        print(f"Error decoding JSON in file {filename}: {e}")
                        continue

                    # Ensure the data is a dictionary
                    if not isinstance(data, dict):
                        print(f"Skipping file {filename}: JSON root is not an object.")
                        continue

                    # Iterate through the key-value pairs in the JSON object
                    for key, value in data.items():
                        print(f"Processing key: {key} in file: {filename}")
                        # Skip keys that are in the excluded list
                        if key in excluded_keys:
                            continue

                        try:
                            # Check if the value is already a dictionary
                            if isinstance(value, dict):
                                parsed_value = value  # Use the dictionary as is
                            else:
                                # Parse the JSON string
                                parsed_value = json.loads(value)

                            # Save the parsed JSON to a new file
                            output_file = os.path.join(output_directory, f"data_{str(index).zfill(3)}.json")                            
                            os.makedirs(output_directory, exist_ok=True)
                            with open(output_file, 'w', encoding='utf-8') as output:
                                json.dump(parsed_value, output, indent=4)

                            print(f"Extracted and saved: {key} -> {output_file}")
                            file_processed = True
                            if str(index) not in chart_category:
                                chart_category[str(index)] = "Others"
                            index += 1
                        except (json.JSONDecodeError, TypeError) as e:
                            print(f"Failed to parse JSON for key '{key}': {e}")
                    if not file_processed:
                        # copy the file to the output directory
                        output_file = os.path.join(output_directory, f"data_{str(index).zfill(3)}.json")
                        shutil.copy(filepath, output_file)
                        print(f"Copied {filepath} to {output_file}")
                        file_processed = True
                        if str(index) not in chart_category:
                            chart_category[str(index)] = "Others"
                        index += 1

                if file_processed:
                    # Delete the file after processing
                    os.remove(filepath)
                    print(f"Deleted: {filepath}")

    # Save the updated chart category JSON
    with open(category_file_path, "w", encoding="utf-8") as file:
        json.dump(chart_category, file, indent=2)

# Main function to execute all steps
def main():
    gen_code_directory = '/workspaces/fluentui-charting-contrib/apps/plotly_examples/python-scripts/plotly_express/generated_python_code/code_blocks'
    extracted_code_directory = '/workspaces/fluentui-charting-contrib/apps/plotly_examples/python-scripts/plotly_express/generated_python_code/extracted_code'
    extracted_json_directory = '/workspaces/fluentui-charting-contrib/apps/plotly_examples/python-scripts/plotly_express/generated_python_code/extracted_json'
    data_directory = '/workspaces/fluentui-charting-contrib/apps/plotly_examples/src/data'
    category_file_path = '/workspaces/fluentui-charting-contrib/apps/plotly_examples/src/components/aggregated_chart_types.json'

    # Step 0: Execute the script generate_visualization_codes() from generate_plotly_schema.py to populate the code_blocks folder
    
    # Step 1: Extract or keep code
    # Comment this step if extracted_code is already populated from code_blocks folder, which might take manual efforts to resolve errors
    # extract_or_keep_code(gen_code_directory, extracted_code_directory)

    # Step 2: Execute Python files
    execute_python_files(extracted_code_directory)

    # Step 3: Extract, parse and save json data  
    extract_and_save_json(extracted_code_directory, extracted_json_directory, data_directory, category_file_path)
    
    # Step 4: Add ID to JSON files
    add_id(extracted_json_directory)

    # Step 5: Copy JSON files to destination
    copy_json_files(extracted_json_directory, data_directory)

# Run the main function
if __name__ == "__main__":
    main()