# Execution Instructions

1. Convert TSV to JSON format using tsv_json.py

`python tsv_to_json.py`

2. Execute json_fields.py to extract the fields from each object

`python extract_json_fields.py`

3. Execute json_fields_2.py to extract the 'executedCode' fields

`python extract_executed_code.py`

4. Execute json_fields_3.py to extract the exact code snippets from the output of Step 3 above

`python extract_code_snippets.py`

5. Finally run python_code_extracted.py to write the code snippets to separate files

`python extracted_code_to_file.py`

6. Find and remove duplicate codes if any

`python find_and_remove_duplicates.py`

