import plotly.express as px
import json

# Sample Data
data = {
    'Category': ['A', 'B', 'C'],
    'Value': [10, 20, 15]
}

# Horizontal Bar Chart
fig = px.bar(data, x='Value', y='Category', orientation='h')

# Export to JSON
with open('bar_chart.json', 'w') as f:
    f.write(fig.to_json())
