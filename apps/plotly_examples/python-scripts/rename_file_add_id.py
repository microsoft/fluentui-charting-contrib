import os
import json
import uuid

def process_json_files(directory):
    unique_id = 872
    output_dir = directory + '/renamed_data'
    os.makedirs(output_dir, exist_ok=True)
    # Iterate through all files in the directory
    for filename in os.listdir(directory):
        if filename.endswith(".json"):  # Process only JSON files
            filepath = os.path.join(directory, filename)
                                    
            # Read the JSON content
            with open(filepath, "r", encoding="utf-8") as file:
                try:
                    data = json.load(file)
                except json.JSONDecodeError as e:
                    print(f"Error decoding JSON in file {filename}: {e}")
                    continue
            
            # Add the "id" property to the JSON content
            data["id"] = unique_id
            
            # Create the new file name
            new_filename = f"data_{unique_id}.json"
            new_filepath = os.path.join(output_dir, new_filename)
            
            # Write the updated JSON content to the new file
            with open(new_filepath, "w", encoding="utf-8") as file:
                json.dump(data, file, indent=4)
            
            # Remove the old file
            os.remove(filepath)
            
            print(f"Processed {filename} -> {new_filename}")
            
            unique_id += 1

# Specify the directory containing the JSON files
directory_path = "./px_express_data"  # Replace with your directory path
process_json_files(directory_path)