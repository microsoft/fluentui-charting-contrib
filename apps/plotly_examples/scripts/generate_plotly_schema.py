import json
import os
import requests
import base64
from azure.identity import InteractiveBrowserCredential, get_bearer_token_provider
from openai import AzureOpenAI


def generate_visualization_schemas(json_data):
    id = 82
    for industry_data in json_data['industries']:
        print(f"Industry: {industry_data['industry']}")
        id = call_llm(json.dumps(industry_data), id)

# Read JSON file
def read_json_file(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)
    
def call_llm(scenario: str, id: int):
    endpoint = "<>"
    deployment = "<>"

    client = AzureOpenAI(
    azure_endpoint=endpoint,
    azure_ad_token_provider=token_provider,
    api_version="2024-02-15-preview",
    )

    completion = client.chat.completions.create(
        model=deployment,
        messages=[
            {
                "role": "system",
                "content": "You are a data analyst having expertize in visualizing data. "
            }
            ,
            {
                "role": "user",
                "content": f"""Create sample visualization for following scenario. Use realistic data to represent the chart. Represent the visualization as 3 different commonly used chart typess using plotly json chart schema.
Create a json object for each plotly schema. Put the 3 schemas together into a json array.
Output the result as an array of json objects. 
Here is a sample output: {{"schemas":[plotly_json_chart_schema_object_1, plotly_json_chart_schema_object_2, plotly_json_chart_schema_object_3]}}
Input scenario: {scenario}""",
            }
        ],
        response_format={ "type": "json_object" }
    )
    text_output = completion.choices[0].message.content.strip()
    print(text_output)

    industry = json.loads(scenario)['industry']
    output = json.loads(text_output)
    schemas =  output['schemas']

    output_dir = 'output_schema'
    os.makedirs(output_dir, exist_ok=True)

    for schema in schemas:
        schema['id'] = id
        output_file_path = os.path.join(output_dir, f'data_{id}_{industry}.json')
        with open(output_file_path, 'w') as file:
            json.dump(schema, file, indent=4)
            id += 1
    
    return id


file_path = 'scenarios.json'

token_provider = get_bearer_token_provider(InteractiveBrowserCredential(), "https://cognitiveservices.azure.com/.default")

# Read and parse the JSON content
json_data = read_json_file(file_path)
generate_visualization_schemas(json_data)