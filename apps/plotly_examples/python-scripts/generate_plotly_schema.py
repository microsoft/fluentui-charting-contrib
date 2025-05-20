import json
import os
import random
import glob
from azure.identity import DefaultAzureCredential, InteractiveBrowserCredential, get_bearer_token_provider
from openai import AzureOpenAI

class FileManager:
    """Utility class for file operations."""

    @staticmethod
    def read_json_file(file_path):
        with open(file_path, 'r') as file:
            return json.load(file)

    @staticmethod
    def write_json_file(file_path, data):
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w') as file:
            json.dump(data, file, indent=4)

class LLMClient:
    """Handles interactions with the Azure OpenAI API."""

    def __init__(self, token_provider):
        endpoint = "<>"
        self.deployment = "<>"
        self.client = AzureOpenAI(
            azure_endpoint=endpoint,
            azure_ad_token_provider=token_provider,
            api_version="2025-01-01-preview",
        )

    def call_llm(self, messages, response_format):
        """Generic method to call the Azure OpenAI API."""
        completion = self.client.chat.completions.create(
            model=self.deployment,
            messages=messages,
            response_format=response_format
        )
        return completion.choices[0].message.content.strip()
    
    def call_llm_plotly_schema(self, scenario: str, id: int):
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
        text_output = self.call_llm(messages, response_format)
        
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

    def call_llm_detailed_plotly_schema(self, scenario: str, id: int, suffix: str):
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
            return id+1, False
        
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
            return id, False
        
        output_dir = 'generated_schema_detailed'
        os.makedirs(output_dir, exist_ok=True)

        data['id'] = id
        output_file_path = os.path.join(output_dir, f'data_{id}{suffix}.json')
        with open(output_file_path, 'w') as file:
            json.dump(data, file, indent=4)
            id=id+1
        
        return id, True

    def call_llm_python_code(self, scenario: str, id: int, prompt: str = "", theme: str = "", number_of_charts: int = 3):
        default_prompt = "Represent the visualization as {number_of_charts} different suitable chart types using Plotly Express. Choose the chart types that best fit the data and scenario."
        if prompt == "":
            prompt = default_prompt
        messages = [
            {
                "role": "system",
                "content": "You are a data analyst having expertise in visualizing data using Python and Plotly Express."
            },
            {
                "role": "user",
                "content": f"""Create Python code using Plotly Express to generate visualizations for the following scenario. 
                    Use realistic data to show in the chart.
                    {prompt}
                    The Python code should generate the Plotly JSON chart schemas for each visualization.
                    Output the result as Python code that, when executed, will generate and save the JSON schemas for the charts to a file. Do not include any other text or explanation. The python code should strictly adhere to {number_of_charts} nuumber of charts.
                    Input scenario: {scenario}"""
            }
        ]
        response_format = {"type": "text"}
        python_code_output = self.call_llm(messages, response_format)
        
        industry = json.loads(scenario)['industry'].replace(" ", "_")
        output_dir = 'generated_python_code/code_blocks'
        os.makedirs(output_dir, exist_ok=True)

        output_file_path = os.path.join(output_dir, f'plotly_code_{id}_{industry}_{theme}.py')
        with open(output_file_path, 'w', encoding="utf-8") as file:
            file.write(python_code_output)
            id = id + 1
        
        return id
    
    def call_llm_locale_plotly_schema(self, scenario: str, id: int, industry:str, language: str):
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
                text_output = self.call_llm(messages, response_format)
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


class VisualizationGenerator:
    """Generates visualization scenarios, schemas, and codes."""

    def __init__(self, scenario_dir, token_provider):
        self.scenario_dir = scenario_dir
        self.llm_client = LLMClient(token_provider)

    def generate_visualization_scenarios(self, json_data):
        response_format = {
            'type': 'json_schema',
            'json_schema': {
                "name": "ScenariosSchema",
                "schema": Response.model_json_schema()
            }
        }
        for industry_data in json_data['industries']:
            print(f"Industry: {industry_data['industry']}")
            messages = [
                {
                    "role": "system",
                    "content": "You are a data analyst having expertise in creating data visualizations."
                },
                {
                    "role": "user",
                    "content": f"""Refer to the below example. Generate similar scenarios that need charts to showcase the reports and dashboards for {industry_data['industry']} industry.
Provide detailed explanation of each scenario in 10 lines in the description section. Generate the output in a similar JSON structure. Include information like the columns needed, sources of data, aggregation level needed in the report.
[START EXAMPLE]
{json.dumps(industry_data)}
[END EXAMPLE]
"""
                }
            ]
            response_text = self.llm_client.call_llm(messages=messages, response_format=response_format)
            output_file_path = os.path.join(self.scenario_dir, f'{industry_data["industry"]}.json')
            FileManager.write_json_file(output_file_path, response_text)

    def generate_visualization_schemas(self):
        if not os.path.exists(self.scenario_dir):
            print("Populate the detailed scenarios first by calling generate_visualization_scenarios()")
            return

        id = 112
        for file_name in os.listdir(self.scenario_dir):
            json_data = FileManager.read_json_file(os.path.join(self.scenario_dir, file_name))
            for scenario_data in json_data['scenarios']:
                print(f"Industry: {scenario_data['industry']}, Scenario: {scenario_data['scenario_name']}")
                id = self.llm_client.call_llm_plotly_schema(json.dumps(scenario_data), id)

    def generate_visualization_codes(self):
        if not os.path.exists(self.scenario_dir):
            print("Populate the detailed scenarios first by calling generate_visualization_scenarios()")
            return

        id = 428
        for file_name in os.listdir(self.scenario_dir):
            file_path = os.path.join(self.scenario_dir, file_name)
            try:
                json_data = FileManager.read_json_file(file_path)
                # Ensure json_data is a dictionary
                if isinstance(json_data, str):
                    json_data = json.loads(json_data)
            except (json.JSONDecodeError, TypeError) as e:
                print(f"Error reading or parsing JSON file {file_name}: {e}")
                continue

            for scenario_data in json_data.get('scenarios', []):
                print(f"Industry: {scenario_data['industry']}, Scenario: {scenario_data['scenario_name']}")
                id = self.llm_client.call_llm_python_code(json.dumps(scenario_data), id)
                
    def generate_visualization_python_code_colors(self):
        if not os.path.exists(self.scenario_dir):
            print("Populate the detailed scenarios first by calling generate_visualization_scenarios()")
            return
        color_themes = ['dark', 'muted', 'monochrome', 'vintage', 'modern',  'subtle', 'tropical', 'arctic', 'classic', 'midnight', 'neon', 'natural', 'sunset', 'bold', 'woodland', 'gradient', 'earth tones', 'warm', 'urban', 'metallic', 'light', 'desert', 'pastel', 'cool', 'oceanic', 'twilight', 'vibrant', 'dusk', 'colorful']
        id = 737
        chart = "Donut"
        prompt = f"Represent the visualization as {chart} chart providing color to each segment."
        for file_name in os.listdir(self.scenario_dir):
            file_path = os.path.join(self.scenario_dir, file_name)
            print(f"Processing file: {file_name}")
            try:
                json_data = FileManager.read_json_file(file_path)
                # Ensure json_data is a dictionary
                if isinstance(json_data, str):
                    json_data = json.loads(json_data)
            except (json.JSONDecodeError, TypeError) as e:
                print(f"Error reading or parsing JSON file {file_name}: {e}")
                continue
            # select a subset of theme colors of size 2
            random.shuffle(color_themes)
            color_themes = color_themes[:2]
            for theme in color_themes:
                print(f"Using theme: {theme}")
                prompt += f"Use {theme} color theme for the charts."
                for scenario_data in json_data.get('scenarios', []):
                    print(f"Industry: {scenario_data['industry']}, Scenario: {scenario_data['scenario_name']}, Theme: {theme}")
                    id = self.llm_client.call_llm_python_code(json.dumps(scenario_data), id, prompt, theme, 1)
                    break

    def generate_detailed_visualization_schemas(self):
        print('Generating detailed schemas')
        scenario_dir = 'generated_schema'
        if not os.path.exists(scenario_dir):
            print("Populate the schemas first by calling generate_visualization_schemas()")
        id = 303
        sample_size = min(25, len(os.listdir(self.scenario_dir)))
        chart_types = {}
        for file_name in os.listdir(scenario_dir):
            json_data = self.read_json_file(os.path.join(scenario_dir, file_name))
            chart_type = json_data['data'][0]['type']
            if chart_type not in chart_types:
                chart_types[chart_type] = []
            chart_types[chart_type].append(file_name)

        min_samples_per_chart_type = sample_size // len(chart_types)
        random_files = []
        for chart_type, files in chart_types.items():
            random_files.extend(random.sample(files, min(min_samples_per_chart_type, len(files))))

        # keeping extra buffer data in case any one fails to generate
        buffer_data = 50
        if len(random_files) < sample_size + buffer_data:
            remaining_files = [file for file in os.listdir(scenario_dir) if file not in random_files]
            if len(remaining_files) > 0:
                random_files.extend(random.sample(remaining_files, ((sample_size + buffer_data) - len(random_files))))

        count = 0
        for file_name in random_files:
            if count == sample_size:
                break
            json_data = self.read_json_file(os.path.join(scenario_dir, file_name))
            curr_id = json_data['id']
            file_name_prefix = file_name.split('.')[0]
            suffix = file_name_prefix.split(str(curr_id))[1]
            id, isSuccess = self.llm_client.call_llm_detailed_plotly_schema(json.dumps(json_data), id, suffix)
            if isSuccess:
                count = count + 1
            
    def generate_locale_visualization_schemas(self):
        if not os.path.exists(self.scenario_dir):
            print("Populate the details scenarios first by calling generate_visualization_scenarios()")
        id = 278
        all_scenarios = []
        all_languages = ['Arabic', 'Chinese', 'German', 'Italian', 'Japanese']

        for file_name in os.listdir(self.scenario_dir):
            json_data_str = self.read_json_file(os.path.join(self.scenario_dir, file_name))
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
                # randomly pick any 1 scenario from the list
                random_scenario = random.choice(scenario_data_list)
                industry = scenario_data['industry'].replace(" ", "_")
                id = self.llm_client.call_llm_locale_plotly_schema(json.dumps(random_scenario), id, industry, language)


class ChartTypeGenerator:
    """Generates chart types from images."""

    def __init__(self, token_provider):
        self.llm_client = LLMClient(token_provider)

    def get_chart_type_from_image(self):
        directory_path = os.path.join('..', 'tests', 'Plotly.spec.ts-snapshots')
        files = glob.glob(os.path.join(directory_path, '*'))

        chart_types = {}

        for file_path in files:
            file_name = os.path.basename(file_path)
            file_number = file_name.split('-')[3]
            if file_number.isdigit():
                file_number = file_number.zfill(3)

                with open(file_path, 'rb') as image_file:
                    response_format = {"type": "json_object"}
                    messages = [
                        {
                            "role": "system",
                            "content": "You are an image data analyst having expertise in predicting data visualizations."
                        },
                        {
                            "role": "user",
                            "content": f"""Refer to the image {image_file} and predict the chart type that best fits the data among 'Area', 'Line', 'Donut', 'Pie', 'Gauge', 'Horizontal Bar With Axis', 'Vertical Bar', 'Vertical Stacked Bar', 'Grouped Vertical Bar', 'Heatmap', 'Sankey'. Mark the chart type as 'Others' if none of the above types match. Provide the output in the form of a JSON object. Categorize the images correctly based on the chart type.
For example: {{"chart_type": "Area"}}"""
                        }
                    ]
                    response = self.llm_client.call_llm(messages, response_format)
                    data = json.loads(response)
                    retry_count = 0
                    while 'chart_type' not in data and retry_count < 3:
                        response = self.llm_client.call_llm(messages, response_format)
                        data = json.loads(response)
                        retry_count += 1
                    if retry_count == 3:
                        print(f"Failed to get chart type for file {file_number}")
                        continue
                    chart_type = data['chart_type']

                    chart_types[file_number] = chart_type

        chart_types_json = json.dumps(chart_types, indent=2)
        output_path = 'aggregated_chart_types.json'
        FileManager.write_json_file(output_path, chart_types_json)


# Main Execution
if __name__ == "__main__":
    token_provider = get_bearer_token_provider(  
        DefaultAzureCredential(),  
        "https://cognitiveservices.azure.com/.default"  
    )      
    scenario_dir = 'detailed_scenarios'

    # Generate visualizations
    visualization_generator = VisualizationGenerator(scenario_dir, token_provider)
    visualization_generator.generate_visualization_python_code_colors()

    # Generate chart types from images
    # chart_type_generator = ChartTypeGenerator(token_provider)
    # chart_type_generator.get_chart_type_from_image()