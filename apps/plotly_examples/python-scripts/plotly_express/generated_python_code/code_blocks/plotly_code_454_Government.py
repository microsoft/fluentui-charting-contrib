```python
import plotly.express as px
import json

# Sample Data
data_gantt = {
    'Task': ['Project A', 'Project B', 'Project C', 'Project D'],
    'Start': ['2023-01-01', '2023-02-01', '2023-03-01', '2023-04-01'],
    'Finish': ['2023-06-30', '2023-05-30', '2023-08-30', '2023-09-30']
}

data_budget = {
    'Category': ['Construction', 'Consulting', 'Materials', 'Labor', 'Miscellaneous'],
    'Budget': [40, 20, 15, 15, 10]
}

data_heatmap = {
    'Office': ['East', 'West', 'North', 'South', 'Central'],
    'Quarter': ['Q1', 'Q2', 'Q3', 'Q4'],
    'Resources': [[10, 20, 30, 40], [20, 15, 25, 30], [30, 50, 40, 45], [40, 20, 30, 35], [50, 60, 70, 80]]
}

# Create Gantt Chart
fig_gantt = px.timeline(data_gantt, x_start='Start', x_end='Finish', y='Task', title='Project Timelines')
gantt_json = fig_gantt.to_json()

# Create Pie Chart
fig_budget = px.pie(data_budget, names='Category', values='Budget', title='Budget Allocation Efficiency')
budget_json = fig_budget.to_json()

# Create Heatmap Chart
fig_heatmap = px.imshow(data_heatmap['Resources'], 
                        labels=dict(x="Office", y="Quarter", color="Resources"),
                        x=data_heatmap['Office'], 
                        y=data_heatmap['Quarter'],
                        title='Resource Concentration Areas')
heatmap_json = fig_heatmap.to_json()

# Save the JSON schemas to a file
json_schemas = {
    'gantt_chart': gantt_json,
    'pie_chart': budget_json,
    'heatmap_chart': heatmap_json
}

with open('plotly_json_schemas.json', 'w') as f:
    json.dump(json_schemas, f)
```