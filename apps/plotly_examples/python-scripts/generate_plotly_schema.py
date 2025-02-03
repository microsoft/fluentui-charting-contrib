import json
import os
from pydantic import BaseModel
from azure.identity import ManagedIdentityCredential, DefaultAzureCredential, VisualStudioCodeCredential, InteractiveBrowserCredential, get_bearer_token_provider
from openai import AzureOpenAI
import random
import glob

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

def generate_detailed_visualization_schemas():
    scenario_dir = 'generated_schema'
    if not os.path.exists(scenario_dir):
        print("Populate the schemas first by calling generate_visualization_schemas()")
    id = 253
    sample_size = min(25, len(os.listdir(scenario_dir)))
    random_files = random.sample(os.listdir(scenario_dir), sample_size)
    for file_name in random_files:
        json_data = read_json_file(os.path.join(scenario_dir, file_name))
        curr_id = json_data['id']
        file_name_prefix = file_name.split('.')[0]
        suffix = file_name_prefix.split(str(curr_id))[1]
        id = call_llm_detailed_plotly_schema(json.dumps(json_data), id, suffix)
        
def generate_locale_visualization_schemas():
    if not os.path.exists(scenario_dir):
        print("Populate the details scenarios first by calling generate_visualization_scenarios()")
    id = 278
    all_scenarios = []
    all_languages = ['Arabic', 'Chinese', 'German', 'Italian', 'Japanese']

    for file_name in os.listdir(scenario_dir):
        json_data_str = read_json_file(os.path.join(scenario_dir, file_name))
        json_data = json.loads(json_data_str)
        all_scenarios.extend(json_data['scenarios'])

    sample_size = min(5, len(all_scenarios))
    random_scenarios = random.sample(all_scenarios, sample_size)
    for language in all_languages:
        for scenario_data in random_scenarios:
            print(f"Industry: {scenario_data['industry']}, Scenario: {scenario_data['scenario_name']}")
            scenario_data_list = []
            for scenario in json_data['scenarios']:
                scenario_data_list.append(scenario['scenario_name'])
            #randomly pick any 1 scenario from the list
            random_scenario = random.choice(scenario_data_list)
            industry = scenario_data['industry'].replace(" ", "_")
            id = call_llm_locale_plotly_schema(json.dumps(random_scenario), id, industry, language)
    
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

def call_llm_locale_plotly_schema(scenario: str, id: int, industry:str, language: str):
    messages=[
            {
                "role": "system",
                "content": "You are a data analyst having expertize in visualizing data. "
            }
            ,
            {
                "role": "user",
                "content": f"""Create sample visualization for following scenario in language {language}. Represent the visualization as a suitable chart types using plotly json chart schema.
                Choose the chart that best fits the data and scenario. Use realistic data to show in the chart. Ensure that the data field is an array.
                Here is a sample output: {{
                    "data": [
                        {{
                            "type": "bar",
                            "x": ["Q1", "Q2", "Q3", "Q4"],
                            "y": [1200, 1500, 1300, 1700],
                            "name": "North America",
                            "marker": {{"color": "blue"}}
                        }},
                        {{
                            "type": "bar",
                            "x": ["Q1", "Q2", "Q3", "Q4"],
                            "y": [900, 1100, 1000, 1300],
                            "name": "Europe",
                            "marker": {{"color": "green"}}
                        }},
                    ],
                    "layout": {{
                        "title": "Quarterly Sales Volume by Region",
                        "barmode": "group",
                        "xaxis": {{"title": "Quarter"}},
                        "yaxis": {{"title": "Sales Volume"}}
                    }},
                    "id": 112
                }},
                Input scenario: {scenario}""",
            }
        ]
    response_format={ "type": "json_object" }    

    retry_count=0
    while retry_count<3:
        try:
            text_output = call_llm(messages, response_format)
            data = json.loads(text_output)
            break
        except:
            print("Retrying")
            retry_count+=1            

    if retry_count == 3:
        print("Failed to generate schema")
        return id
    
    output_dir = 'generated_schema_locale'
    os.makedirs(output_dir, exist_ok=True)

    data['id'] = id
    output_file_path = os.path.join(output_dir, f'data_{id}_{industry}_{language}.json')
    with open(output_file_path, 'w') as file:
        json.dump(data, file, indent=4)
        id += 1
    
    return id
    
def call_llm_detailed_plotly_schema(scenario: str, id: int, suffix: str):
    messages=[
            {
                "role": "system",
                "content": "You are a data analyst having expertize in visualizing data. "
            }
            ,
            {
                "role": "user",
                "content": f"""Extrapolate the visualizations for the following scenario such that the data array contains 25 series objects keeping the 'type' same for all. Each series within data array should contain 10 data points. Use realistic data to show in the charts. 
                Output the result as an array of at least 25 JSON series data objects. Ensure that the dataset is large and comprehensive, covering various aspects of the scenario. Datasets having fewer than 25 objects within data array will not be accepted. Type for each object should be exactly same.               
                Example input data:
                {{
                    "data": [
                        {{
                            "type": "bar",
                            "x": ["Q1", "Q2", "Q3", "Q4"],
                            "y": [1200, 1500, 1300, 1700],
                            "name": "North America",
                            "marker": {{"color": "blue"}}
                        }},
                        {{
                            "type": "bar",
                            "x": ["Q1", "Q2", "Q3", "Q4"],
                            "y": [900, 1100, 1000, 1300],
                            "name": "Europe",
                            "marker": {{"color": "green"}}
                        }},
                    ],
                    "layout": {{
                        "title": "Quarterly Sales Volume by Region",
                        "barmode": "group",
                        "xaxis": {{"title": "Quarter"}},
                        "yaxis": {{"title": "Sales Volume"}}
                    }},
                    "id": 112
                }}
                Example output data:
                {{
                    "data": [
                        {{
                            "type": "bar",
                            "x": ["Q1", "Q2", "Q3", "Q4",..., "Q10"],
                            "y": [1200, 1500, 1300, 1700,..., 1400],
                            "name": "North America",
                            "marker": {{"color": "blue"}}
                        }},                        
                        ...23 more objects...,
                        {{
                            "type": "bar",
                            "x": ["Q1", "Q2", "Q3", "Q4",..., "Q10"],
                            "y": [800, 850, 825, 875,..., 850],
                            "name": "Central America",
                            "marker": {{"color": "grey"}}
                        }}
                    ],                    
                    "layout": {{
                        "title": "Quarterly Sales Volume by Region",
                        "barmode": "group",
                        "xaxis": {{"title": "Quarter"}},
                        "yaxis": {{"title": "Sales Volume"}}
                    }},
                    "id": 253
                }}
                
                Input scenario to extrapolate with at least 25 series data objects with each series containing at least 10 data points: {scenario}
                """
            }
        ]
    response_format={ "type": "json_object" }
    
    # call only if the file does not exist
    if os.path.exists(f'generated_schema_detailed/data_{id}{suffix}.json'):
        print(f"Skipping {id}_{suffix}")
        return id+1
    
    # in case text_output is not a valid json, it will retry 3 times
    retry_count=0
    while retry_count<3:
        try:
            text_output = call_llm(messages, response_format)
            data = json.loads(text_output)
            break
        except:
            print("Retrying")
            retry_count+=1            

    if retry_count == 3:
        print("Failed to generate schema")
        return id
    
    output_dir = 'generated_schema_detailed'
    os.makedirs(output_dir, exist_ok=True)

    data['id'] = id
    output_file_path = os.path.join(output_dir, f'data_{id}{suffix}.json')
    with open(output_file_path, 'w') as file:
        json.dump(data, file, indent=4)
        id=id+1
    
    return id

def get_chart_type_from_image():
    directory_path = os.path.join('..', 'tests', 'Plotly.spec.ts-snapshots')
    files = glob.glob(os.path.join(directory_path, '*'))
    print(f'Processing files: {files}')
    dir_path = 'C:\\Users\\srmukher\\Documents\\fluentui-charting-contrib\\apps\\plotly_examples\\tests\\Plotly.spec.ts-snapshots'

    files = glob.glob(os.path.join(dir_path, '*'))

    chart_types = {}

    for file_path in files:
        # Extract the file number from the file path
        file_name = os.path.basename(file_path)
        file_number = file_name.split('-')[3]
        print('file_number:', file_number)

        with open(file_path, 'rb') as image_file:
            response_format={ "type": "json_object" }
            messages = [
                {
                    "role": "system",
                    "content": "You are an image data analyst having expertize in predicting data visualizations."
                }
                ,
                {
                    "role": "user",
                    "content": f"""Refer the image {image_file} and predict the chart type that best fits the data among 'Area', 'Line', 'Donut', 'Pie', 'Guage', 'Horizontal Bar tWithAxis', 'Vertical Bar', 'Vertical Stacked Bar ', 'Grouped Vertical Bar', 'Heatmap', 'Sankey'. Mark the chart type as 'Others' if none of the above types match.  Provide the output in the form of a json object. Categorize the images correctly based on the chart type.
                    For example: {{"chart_type": "Area"}}"""
                }
            ]
            response = call_llm(messages, response_format)
            data = json.loads(response)
            retry_count = 0
            while 'chart_type' not in data and retry_count < 3:
                response = call_llm(messages, response_format)
                data = json.loads(response)
                retry_count += 1
            if retry_count == 3:
                print(f"Failed to get chart type for file {file_number}")
                continue
            chart_type = data['chart_type']

            # Map the file number and chart type
            chart_types[file_number] = chart_type

    chart_types_json = json.dumps(chart_types, indent=2)

    output_path = 'aggregated_chart_types.json'
    with open(output_path, 'w') as output_file:
        output_file.write(chart_types_json)    

file_path = 'scenarios_level1.json'

token_provider = get_bearer_token_provider(InteractiveBrowserCredential(), "https://cognitiveservices.azure.com/.default")

# Read and parse the JSON content
# json_data = read_json_file(file_path)
# generate_visualization_scenarios(json_data)
# generate_visualization_schemas()

# Generate detailed schemas
# generate_detailed_visualization_schemas()

# Generate locale based schemas
# generate_locale_visualization_schemas()

# Generate chart types from screenshots taken by Playwright
get_chart_type_from_image()