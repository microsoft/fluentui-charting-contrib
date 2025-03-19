import os
import base64
import numpy as np
import json

# Define the path to the data folder
data_folder = '../../src/data'

# Function to check if a string is base64-encoded
def is_base64(s):
    try:
        if isinstance(s, str):
            s_bytes = s.encode('ascii')
        elif isinstance(s, bytes):
            s_bytes = s
        else:
            raise ValueError("Input must be a string or bytes")
        return base64.b64encode(base64.b64decode(s_bytes)) == s_bytes
    except Exception:
        return False

# Helper function to decode base64-encoded data based on dtype
def decode_base64(value, dtype):
    decoded_bytes = base64.b64decode(value)
    if dtype == 'f8':
        return np.frombuffer(decoded_bytes, dtype=np.float64).tolist()
    elif dtype == 'i8':
        return np.frombuffer(decoded_bytes, dtype=np.int64).tolist()
    elif dtype == 'u8':
        return np.frombuffer(decoded_bytes, dtype=np.uint64).tolist()
    elif dtype == 'i4':
        return np.frombuffer(decoded_bytes, dtype=np.int32).tolist()
    elif dtype == 'i2':
        return np.frombuffer(decoded_bytes, dtype=np.int16).tolist()
    elif dtype == 'i1':
        return np.frombuffer(decoded_bytes, dtype=np.int8).tolist()
    else:
        try:
            return decoded_bytes.decode('utf-8')
        except UnicodeDecodeError:
            return decoded_bytes

# Function to decode base64-encoded 'bdata' in a dictionary
def decode_bdata_in_dict(d):
    for key, value in d.items():
        if isinstance(value, dict):
            decode_bdata_in_dict(value)
        elif key == 'bdata' and is_base64(value):
            dtype = d.get('dtype', 'utf-8')
            d[key] = decode_base64(value, dtype)
        elif isinstance(value, list):
            for i in range(len(value)):
                if isinstance(value[i], dict):
                    decode_bdata_in_dict(value[i])

# Iterate through all files in the data folder
for filename in os.listdir(data_folder):
    file_path = os.path.join(data_folder, filename)
    
    # Check if it's a file
    if os.path.isfile(file_path):
        with open(file_path, 'r') as file:
            # Read the JSON data
            original_data = json.load(file)
            
            # Make a copy of the original data to decode
            data = json.loads(json.dumps(original_data))
            
            # Decode base64-encoded 'bdata' in the JSON data
            decode_bdata_in_dict(data)
            
            # Check if the data has changed
            if data != original_data:
                isNan = False
                # Overwrite the 'y' value with the decoded 'bdata'
                for item in data.get('data', []):
                    if 'y' in item and isinstance(item['y'], dict) and 'bdata' in item['y']:
                        if any(np.isnan(x) for x in item['y']['bdata'] if isinstance(x, float)):
                            isNan = True
                            break
                        else:
                            item['y'] = item['y']['bdata']
                    if 'x' in item and isinstance(item['x'], dict) and 'bdata' in item['x']:
                        if any(np.isnan(x) for x in item['x']['bdata'] if isinstance(x, float)):
                            isNan = True
                            break
                        else:
                            item['x'] = item['x']['bdata']
                    if 'z' in item and isinstance(item['z'], dict) and 'bdata' in item['z']:
                        if any(np.isnan(x) for x in item['z']['bdata'] if isinstance(x, float)):
                            isNan = True
                            break
                        else:
                            item['z'] = item['z']['bdata']
                if not isNan:
                    print(f"Decoded values from {filename}:")                
                    # Write the decoded data back to the file
                    with open(file_path, 'w') as outfile:
                        json.dump(data, outfile, indent=4)
