import json
import pandas as pd
import plotly.express as px

# Create realistic data
data = {
    "factory_location": ["Factory A", "Factory B", "Factory C", "Factory D"],
    "production_volume": [1200, 900, 1500, 1100],
    "operational_hours": [24, 20, 24, 22],
    "downtime": [2, 5, 1, 3],
    "efficiency": [90, 80, 95, 85]
}

# Convert to DataFrame
df = pd.DataFrame(data)

# Generate a heatmap
fig_heatmap = px.imshow(df[['production_volume', 'operational_hours', 'downtime', 'efficiency']].transpose(), 
                        labels=dict(x="Factory Location", color="Values"))
fig_heatmap.update_layout(title="Factory Performance Heatmap")

# Generate a line chart
fig_line_chart = px.line(df, 
                         x=df.index, 
                         y=["production_volume", "operational_hours", "downtime", "efficiency"], 
                         labels={"x": "Factory Index", "value": "Values", "variable": "Metrics"},
                         title="Factory Performance Line Chart")

# Generate a bar chart
fig_bar_chart = px.bar(df, 
                       x="factory_location", 
                       y=["production_volume", "operational_hours", "downtime", "efficiency"], 
                       barmode="group", 
                       title="Factory Performance Bar Chart")

# Save the Plotly JSON schemas to file
chart_schemas = {
    "heatmap": fig_heatmap.to_json(),
    "line_chart": fig_line_chart.to_json(),
    "bar_chart": fig_bar_chart.to_json()
}

with open("factory_performance_charts.json", "w") as f:
    json.dump(chart_schemas, f)
