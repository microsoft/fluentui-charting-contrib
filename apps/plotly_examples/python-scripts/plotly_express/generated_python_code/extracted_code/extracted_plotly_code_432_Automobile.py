import plotly.express as px
import pandas as pd
import json

# Sample Data
data = {
    'Month': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] * 5,  # Repeat to match length
    'Emission Type': ['Carbon Dioxide', 'Nitrogen Oxides', 'Sulfur Dioxide', 'Carbon Monoxide', 'Lead'] * 12,
    'Emission Levels': [200, 150, 180, 220, 70, 205, 155, 185, 225, 75, 210, 160, 190, 230, 80, 215, 165, 195, 235, 85, 220, 170, 200, 240, 90, 225, 175, 205, 245, 95, 230, 180, 210, 250, 100, 235, 185, 215, 255, 105, 240, 190, 220, 260, 110, 245, 195, 225, 265, 115, 250, 200, 230, 270, 120, 255, 205, 235, 275, 125],
    'Compliance Standards': [180, 160, 190, 210, 60, 185, 165, 195, 215, 65, 190, 170, 200, 220, 70, 195, 175, 205, 225, 75, 200, 180, 210, 230, 80, 205, 185, 215, 235, 85, 210, 190, 220, 240, 90, 215, 195, 225, 245, 95, 220, 200, 230, 250, 100, 225, 205, 235, 255, 105, 230, 210, 240, 260, 110, 235, 215, 245, 265, 115],
    'Incident Location': ['Denver', 'Phoenix', 'San Francisco', 'Detroit', 'Houston'] * 12
}

df = pd.DataFrame(data)

# Generate visualizations and save JSON schemas

# 1. Line Chart
fig_line = px.line(df, x='Month', y='Emission Levels', color='Emission Type', title='Monthly Emission Levels by Emission Type')
fig_line_json = fig_line.to_json()
with open('line_chart.json', 'w') as f:
    f.write(fig_line_json)

# 2. Bar Chart
fig_bar = px.bar(df, x='Incident Location', y='Emission Levels', color='Emission Type', title='Emission Levels at Different Incident Locations', barmode='group')
fig_bar_json = fig_bar.to_json()
with open('bar_chart.json', 'w') as f:
    f.write(fig_bar_json)

# 3. Scatter Plot
fig_scatter = px.scatter(df, x='Emission Levels', y='Compliance Standards', color='Emission Type', size='Emission Levels', title='Emission Levels vs Compliance Standards')
fig_scatter_json = fig_scatter.to_json()
with open('scatter_plot.json', 'w') as f:
    f.write(fig_scatter_json)
