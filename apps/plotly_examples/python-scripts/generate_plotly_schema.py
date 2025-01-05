import json
import os
from pydantic import BaseModel
from azure.identity import ManagedIdentityCredential, DefaultAzureCredential, VisualStudioCodeCredential, InteractiveBrowserCredential, get_bearer_token_provider
from openai import AzureOpenAI

scenario_dir = 'detailed_scenarios'
class Scenario(BaseModel):
    industry: str
    scenario_name: str
    scenario_description: str

class Response(BaseModel):
    scenarios: list[Scenario]

# Read JSON file
def read_json_file(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

def generate_visualization_scenarios(json_data):
    response_format = {
        'type': 'json_schema',
        'json_schema': 
            {
                "name":"ScenariosSchema",
                "schema": Response.model_json_schema()
            }
        }
    for industry_data in json_data['industries']:
        print(f"Industry: {industry_data['industry']}")
        messages = [
            {
                "role": "system",
                "content": "You are a data analyst having expertize in creating data visualizations."
            }
            ,
            {
                "role": "user",
                "content": f"""Refer to the below example. Generate similar scenarios that need charts to showcase the reports and dashboards for {industry_data['industry']} industry.
Provide detailed explanation of each scenario in 10 lines in the description section. Generate the output in a similar json structure. Include information like the columns needed, sources of data, aggregation level needed in the report.
[START EXAMPLE]
{json.dumps(industry_data)}
[END EXAMPLE]
""",
            }
        ]
        response_text = call_llm(messages=messages, response_format=response_format)

        
        os.makedirs(scenario_dir, exist_ok=True)
        output_file_path = os.path.join(scenario_dir, f'{industry_data["industry"]}.json')
        with open(output_file_path, 'w') as file:
            json.dump(response_text, file, indent=4)


def generate_visualization_schemas():
    if not os.path.exists(scenario_dir):
        print("Populate the details scenarios first by calling generate_visualization_scenarios()")
    id = 112

    for file_name in os.listdir(scenario_dir):
        json_data_str = read_json_file(os.path.join(scenario_dir, file_name))
        json_data = json.loads(json_data_str)
        for scenario_data in json_data['scenarios']:
            print(f"Industry: {scenario_data['industry']}, Scenario: {scenario_data['scenario_name']}")
            id = call_llm_plotly_schema(json.dumps(scenario_data), id)


    
def call_llm(messages, response_format):
    endpoint = "<>"
    deployment = "<>"

    client = AzureOpenAI(
    azure_endpoint=endpoint,
    azure_ad_token_provider=token_provider,
    api_version="2024-08-01-preview",
    )

    completion = client.chat.completions.create(
        model=deployment,
        messages=messages,
        response_format=response_format
    )
    text_output = completion.choices[0].message.content.strip()
    return text_output
    
def call_llm_plotly_schema(scenario: str, id: int):
    messages=[
            {
                "role": "system",
                "content": "You are a data analyst having expertize in visualizing data. "
            }
            ,
            {
                "role": "user",
                "content": f"""Create sample visualization for following scenario. Use realistic data to show in the chart. Represent the visualization as 3 different suitable chart types using plotly json chart schema.
                Choose the chart that best fits the data and scenario.
Create a json object for each plotly schema. Put the 3 schemas together into a json array.
Output the result as an array of json objects. 
Here is a sample output: {{"schemas":[plotly_json_chart_schema_object_1, plotly_json_chart_schema_object_2, plotly_json_chart_schema_object_3]}}
Input scenario: {scenario}""",
            }
        ]
    response_format={ "type": "json_object" }
    text_output = call_llm(messages, response_format)
    
    print(text_output)

    industry = json.loads(scenario)['industry'].replace(" ", "_")
    output = json.loads(text_output)
    schemas =  output['schemas']

    output_dir = 'generated_schema'
    os.makedirs(output_dir, exist_ok=True)

    for schema in schemas:
        schema['id'] = id
        output_file_path = os.path.join(output_dir, f'data_{id}_{industry}.json')
        with open(output_file_path, 'w') as file:
            json.dump(schema, file, indent=4)
            id += 1
    
    return id


file_path = 'scenarios_level1.json'

token_provider = get_bearer_token_provider(InteractiveBrowserCredential(), "https://cognitiveservices.azure.com/.default")

# Read and parse the JSON content
json_data = read_json_file(file_path)
#generate_visualization_scenarios(json_data)
generate_visualization_schemas()
