import csv
import json
import pandas as pd
import requests
import os
import shutil
import time
from datetime import datetime, timezone, timedelta

# Increase the field size limit to a large value
csv.field_size_limit(10**7)

# Define the path to the TSV file
working_dir = r"C:\Users\atisjai\dev\interactive_charts_eval_2"
tsv_file_path = os.path.join(working_dir, "cwc_treatment_conversations.tsv")
json_file_path = os.path.join(working_dir, "cwc_treatment_conversations_2_1.json")
context_file_path = os.path.join(working_dir, "context_files_2")
code_file_path = os.path.join(working_dir, "python_code_files_2")
artifacts_dir = os.path.join(working_dir, "generated_artifacts")

def convert_to_structured_df():
    data = pd.read_csv(tsv_file_path, sep='\t', header=None)
    print(data.shape)
    json_columns = [0, 1, 3, 4, 6] # Column 2 and 5 are not JSON columns
    structured_df = None
    for i, iterator in enumerate(data.iterrows()):
        df_row = pd.DataFrame()
        for column_id in json_columns:
            df2 = pd.json_normalize(json.loads(iterator[1][column_id]))
            df2 = df2.add_suffix(f'_{column_id}')
            df_row = pd.concat([df_row, df2], axis=1)
        df_row = df_row.loc[:, ~df_row.columns.str.startswith('reduced_views')] # This column is causing trouble in creating a correct dataframe
        if 'UpdateConversationMessages' in df_row.columns:
            df_row = df_row.drop(columns=['UpdateConversationMessages'])
        df_row.reset_index(drop=True, inplace=True)
        # with open(json_file_path, 'w', encoding='utf-8') as json_file:
        #     json.dump(df_row.to_dict(orient='records'), json_file, indent=4)
        #     break
        if structured_df is None:
            structured_df = df_row
        else:
            print(f"Columns: {len(df_row.columns)}, Unique Columns: {len(set(df_row.columns))}")
            column_diff = set(df_row.columns) - set(structured_df.columns)
            print(f"Mismatch columns: {len(column_diff)}")
            print(structured_df.shape)
            structured_df = structured_df.reset_index(drop=True)
            structured_df = pd.concat([structured_df, df_row], axis=0, ignore_index=True)
    print(structured_df.shape)
    print(structured_df.columns)
        
    with open(json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(json.loads(structured_df.to_json(orient='records')), json_file, indent=4)

    print(f"TSV content has been converted to JSON and saved to {json_file_path}")
    return structured_df

def download_file(file):
    print(f"Downloading file: {file}")
    response = requests.get(file)
    if response.status_code != 200:
        print(f"Failed to download file: {file}")
    
    filename = os.path.basename(file)
    local_file_path = os.path.join(code_file_path, filename)

    # Save the file locally
    with open(local_file_path, 'wb') as file:
        file.write(response.content)

def save_context_files(df):
    for index, row in df.iterrows():
        for file in row['upload_file_paths_0']:
            download_file(file)

def execute_python_code(id):
    file_path = os.path.join(code_file_path, f"code_{id}.py")
    print(f"Executing {file_path}...")
    os.system(f"python {file_path}")
    print(f"Executed {file_path}")

def export_generated_artifacts(id, time_to_compare):
    # Create a directory to store the generated artifacts
    os.makedirs(artifacts_dir, exist_ok=True)
    this_artifact_dir = os.path.join(artifacts_dir, f"artifact_{id}")
    os.makedirs(this_artifact_dir, exist_ok=True)
     #+ timedelta(minutes=-1)
    timestamp_to_compare = time_to_compare.timestamp()

    # Copy the generated artifacts to the artifacts directory
    modified_files = []

    # Walk through the folder and check modification times
    for root, dirs, files in [next(os.walk(code_file_path))]:
        for file in files:
            file_path = os.path.join(root, file)
            file_mod_time = os.path.getmtime(file_path)
            if file_mod_time > timestamp_to_compare:
                modified_files.append(file_path)
        print(f"Modified files in {root}: {modified_files}")

    for file in modified_files:
        shutil.move(file, os.path.join(this_artifact_dir, os.path.basename(file)))

def execute_and_export_artifacts(code_file_count):
    os.chdir(code_file_path)
    time_to_compare = datetime.now(timezone.utc)
    time.sleep(10)
    print(f"Current working directory: {os.getcwd()}")
    for i in range(code_file_count):
        execute_python_code(i)
        export_generated_artifacts(i, time_to_compare)

def save_python_execution_code(input_df):
    code_file_ctr = 0
    for index, row in input_df.iterrows():
        for response in row['filtered_search_6']:
            json_str = response['result']
            try:
                json_obj = json.loads(json_str)
                if 'executedCode' in json_obj:
                    code = json_obj['executedCode']
                    code_filename = os.path.join(code_file_path, f"code_{code_file_ctr}.py")
                    with open(code_filename, 'w', encoding='utf-8') as c_file:
                        c_file.write(code)
                    code_file_ctr += 1
            except json.JSONDecodeError as e:
                print(f"JSON Decode Error: {e}")
                print(json_str)
    return code_file_ctr

if __name__ == "__main__":
    structured_df = convert_to_structured_df()
    os.makedirs(code_file_path, exist_ok=True)
    save_context_files(structured_df)
    code_file_count = save_python_execution_code(structured_df)
    execute_and_export_artifacts(code_file_count)
    
    