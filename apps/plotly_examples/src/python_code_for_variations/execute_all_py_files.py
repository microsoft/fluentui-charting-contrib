import os
import subprocess
import sys

def execute_python_files(directory):
    # Path to the Python executable in the .venv
    venv_python = os.path.join(os.getcwd(), '.venv', 'Scripts', 'python.exe')
    # Fallback to sys.executable if .venv not found
    if not os.path.exists(venv_python):
        venv_python = sys.executable

    # Iterate through all files in the directory
    for filename in os.listdir(directory):
        # Check if the file is a Python file
        if filename.endswith(".py"):
            filepath = os.path.join(directory, filename)
            print(f"Executing: {filepath}")
            try:
                # Execute the Python file
                subprocess.run([venv_python, filepath], check=True)
            except subprocess.CalledProcessError as e:
                print(f"Error occurred while executing {filepath}: {e}")

# Specify the directory containing Python files
directory_path = "./VerticalBar_0530_Colors"  # Replace with your directory path
# cd to the directory by getting the entire path
curr_dir = os.getcwd()
directory_path = os.path.join(curr_dir, directory_path)
os.chdir(directory_path)
execute_python_files(directory_path)