# python script to add ID for each dataset
import json
import os
CURRENT_SCHEMA_ID = 378
def add_id():
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

def get_data_folder():
    current_dir = os.path.dirname(__file__)
    parent_folder = os.path.dirname(current_dir)
    data_dir = os.path.join(parent_folder, 'src', 'data')
    print(f"Data Dir: {data_dir}")
    if not os.path.exists(data_dir):
        raise FileNotFoundError(f"Data folder not found: {data_dir}")
    return data_dir

def add_artifacts_to_test_data(artifacts_folder, start_index=CURRENT_SCHEMA_ID):
    data_folder = get_data_folder()
    for root, dirs, files in os.walk(artifacts_folder):
        for file in files:
            if file.endswith(".json"):
                with open(os.path.join(root, file), 'r') as f:
                    data = json.load(f)
                    if 'id' in data:
                        continue
                    data['id'] = start_index
                    out_file = os.path.join(data_folder, f"data_{start_index}.json")
                    with open(out_file, 'w') as f_out:
                        print(f"Writing data to {os.path.join(data_folder, f'data_{start_index}.json')}")
                        json.dump(data, f_out, indent=4)
                    start_index += 1

if __name__ == "__main__":
    #add_id()
    artifacts_folder = r'C:\Users\atisjai\dev\interactive_charts_eval_2\generated_artifacts'
    add_artifacts_to_test_data(artifacts_folder)
    print("Artifacts added to test data successfully.")
                
