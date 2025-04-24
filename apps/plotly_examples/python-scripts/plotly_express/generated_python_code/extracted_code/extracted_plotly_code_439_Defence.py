import plotly.express as px
import pandas as pd
import json

# Sample data for the scenario
data = {
    "unit ID": ["Unit1", "Unit2", "Unit3", "Unit1", "Unit2", "Unit3", "Unit1", "Unit2", "Unit3"],
    "exercise type": ["E1", "E1", "E1", "E2", "E2", "E2", "E3", "E3", "E3"],
    "completion time": [45, 50, 40, 60, 55, 65, 30, 35, 45],
    "success rate": [0.8, 0.75, 0.85, 0.9, 0.85, 0.88, 0.95, 0.92, 0.97]
}

df = pd.DataFrame(data)

# Create and save visualizations
fig1 = px.scatter(df, x="completion time", y="success rate", color="exercise type", title="Exercise Performance: Completion Time vs Success Rate")
fig2 = px.bar(df, x="unit ID", y="completion time", color="exercise type", title="Completion Time by Unit and Exercise Type")
fig3 = px.line(df, x="exercise type", y="completion time", color="unit ID", title="Completion Time Trends Across Exercises")

# Get the JSON schemas
json_schema1 = fig1.to_json()
json_schema2 = fig2.to_json()
json_schema3 = fig3.to_json()

# Save JSON schemas to a file
schemas = {
    "scatter_chart": json_schema1,
    "bar_chart": json_schema2,
    "line_chart": json_schema3
}

with open("training_exercise_charts.json", "w") as f:
    json.dump(schemas, f)
