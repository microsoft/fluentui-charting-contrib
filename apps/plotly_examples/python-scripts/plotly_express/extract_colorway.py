import os
import json

def extract_colorway_from_files(folder_path, output_file):
    """
    Iterates through JSON files in a folder and extracts the colorway array if present.

    Args:
        folder_path (str): Path to the folder containing JSON files.
        output_file (str): Path to save the extracted colorway data.
    """
    extracted_colorways = {}

    # Iterate through all files in the folder
    for file_name in os.listdir(folder_path):
        if file_name.endswith(".json") and int(file_name.split('_')[1].split('.')[0]) >=570 :  # Process only JSON files
            file_path = os.path.join(folder_path, file_name)
            try:
                colorway_match_default = False
                # Open and load the JSON file
                with open(file_path, 'r', encoding='utf-8') as file:
                    data = json.load(file)

                # Navigate to layout?.template?.layout?.colorway
                colorway = data.get("layout", {}).get("template", {}).get("layout", {}).get("colorway")
                # change each color to lowercase
                if colorway:
                    colorway = [color.lower() for color in colorway]

                # check if colorway matches the default colorway
                if colorway == DEFAULT_PLOTLY_COLORWAY:
                    colorway_match_default = True
                # If colorway is present, add it to the results
                if colorway:
                    extracted_colorways[file_name] = {'colorway': colorway, 'match_default': colorway_match_default}

            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                print(f"Error reading file {file_name}: {e}")

    # Save the extracted colorways to the output file
    with open(output_file, 'w', encoding='utf-8') as output:
        json.dump(extracted_colorways, output, indent=4)

    print(f"Extracted colorways saved to {output_file}")


folder_path = "./"  # Replace with the path to your folder
output_file = "extracted_colorways.json"
DEFAULT_PLOTLY_COLORWAY = [
'#636efa',
'#ef553b',
'#00cc96',
'#ab63fa',
'#ffa15a',
'#19d3f3',
'#ff6692',
'#b6e880',
'#ff97ff',
'#fecb52',
]
extract_colorway_from_files(folder_path, output_file)