import plotly.express as px
import pandas as pd
import json

# Generate realistic data for the given scenario
data = {
    'Supplier Name': ['Supplier 1', 'Supplier 2', 'Supplier 3', 'Supplier 4'],
    'Inventory Levels': [150, 85, 200, 120],
    'Reorder Time': [5, 7, 3, 6],
    'Delivery Schedule': ['2023-10-01', '2023-10-08', '2023-10-15', '2023-10-22']
}

df = pd.DataFrame(data)

# Chart 1: Bar chart for Inventory Levels by Supplier Name
fig1 = px.bar(df, x='Supplier Name', y='Inventory Levels', title='Inventory Levels by Supplier')
fig1_json = fig1.to_json()

# Chart 2: Scatter plot for Reorder Time by Supplier Name
fig2 = px.scatter(df, x='Supplier Name', y='Reorder Time', title='Reorder Time by Supplier')
fig2_json = fig2.to_json()

# Chart 3: Line chart for Delivery Schedule by Supplier Name
fig3 = px.line(df, x='Delivery Schedule', y='Inventory Levels', color='Supplier Name', title='Inventory Levels over Delivery Schedule')
fig3_json = fig3.to_json()

# Save JSON schemas to file
with open("plotly_json_schemas.json", "w") as file:
    json.dump({'Bar Chart': fig1_json, 'Scatter Plot': fig2_json, 'Line Chart': fig3_json}, file)
