import plotly.express as px
import pandas as pd
import json

# Create example DataFrame
data = {
    "equipment_id": ["E001", "E002", "E003", "E004", "E005"],
    "last_maintenance_date": ["2023-01-01", "2023-02-01", "2023-03-01", "2023-04-01", "2023-05-01"],
    "hours_of_operation": [1500, 1200, 1300, 1400, 1100],
    "operational_temperature": [75, 80, 78, 85, 77],
    "week": ["2023-W34", "2023-W34", "2023-W34", "2023-W34", "2023-W34"]
}

df = pd.DataFrame(data)

# Generate line chart for trend of operational temperature over weeks
fig_line = px.line(df, x='week', y='operational_temperature', color='equipment_id', title="Trend of Operational Temperature Over Weeks")
line_chart_json = fig_line.to_json()

# Generate bar chart for hours of operation for each equipment
fig_bar = px.bar(df, x='equipment_id', y='hours_of_operation', title="Hours of Operation for Each Equipment")
bar_chart_json = fig_bar.to_json()

# Generate scatter plot for operational temperature vs hours of operation
fig_scatter = px.scatter(df, x='hours_of_operation', y='operational_temperature', color='equipment_id', title="Operational Temperature vs Hours of Operation")
scatter_chart_json = fig_scatter.to_json()

# Save JSON schemas to file
schemas = {
    "line_chart": line_chart_json,
    "bar_chart": bar_chart_json,
    "scatter_chart": scatter_chart_json
}

with open("chart_schemas.json", "w") as file:
    json.dump(schemas, file)
