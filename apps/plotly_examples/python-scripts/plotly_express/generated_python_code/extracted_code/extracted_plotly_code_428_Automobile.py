import plotly.express as px
import pandas as pd
import json

# Sample data for the scenario
data = {
    'Date': pd.date_range(start='2021-01-01', periods=24, freq='ME'),  # Changed 'M' to 'ME'
    'Region': ['North', 'South', 'East', 'West'] * 6,
    'Model': ['Sedan', 'SUV', 'Truck', 'Coupe'] * 6,
    'Sales Volume': [200, 300, 150, 120, 250, 320, 180, 140, 210, 290, 160, 130, 225, 310, 170, 120, 230, 280, 165, 115, 240, 270, 185, 110]
}

df = pd.DataFrame(data)

# Line chart showing monthly sales trends over time
fig1 = px.line(
    df, 
    x="Date", 
    y="Sales Volume", 
    color="Model", 
    title="Monthly Sales Volume Trends by Model"
)

# Bar chart showing total sales volume by region and model
fig2 = px.bar(
    df.groupby(['Region', 'Model'])['Sales Volume'].sum().reset_index(), 
    x="Region", 
    y="Sales Volume", 
    color="Model", 
    title="Total Sales Volume by Region and Model"
)

# Pie chart showing sales volume distribution among regions
fig3 = px.pie(
    df.groupby('Region')['Sales Volume'].sum().reset_index(), 
    values="Sales Volume", 
    names="Region", 
    title="Sales Volume Distribution Among Regions"
)

# Save JSON schemas to a file
json_schemas = {
    "line_chart": fig1.to_json(),
    "bar_chart": fig2.to_json(),
    "pie_chart": fig3.to_json()
}

with open('plotly_json_schemas.json', 'w') as f:
    json.dump(json_schemas, f)