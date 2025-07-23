import csv
import json

# Increase the field size limit to a large value
csv.field_size_limit(10**7)

# Define the path to the TSV file
tsv_file_path = r".\cwc_treatment_conversations.tsv"
json_file_path = r".\cwc_treatment_conversations.json"

# Read the TSV file and convert it to a list of dictionaries
with open(tsv_file_path, 'r', encoding='utf-8') as tsv_file:
    reader = csv.DictReader(tsv_file, delimiter='\t')
    data = [row for row in reader]

# Convert the list of dictionaries to JSON
with open(json_file_path, 'w', encoding='utf-8') as json_file:
    json.dump(data, json_file, indent=4)

print(f"TSV content has been converted to JSON and saved to {json_file_path}")