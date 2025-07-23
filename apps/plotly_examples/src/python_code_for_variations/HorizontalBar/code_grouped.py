import plotly.express as px
import pandas as pd

# Sample data
df = pd.DataFrame({
    'Category': ['A', 'A', 'B', 'B', 'C', 'C'],
    'Subgroup': ['X', 'Y'] * 3,
    'Value': [10, 15, 7, 12, 5, 9]
})

# Create grouped horizontal bar chart
fig = px.bar(
    df,
    x='Value',
    y='Category',
    color='Subgroup',           # This enables grouping
    barmode='group',
    orientation='h',
    title="Grouped Horizontal Bar Chart"
)

# Save to JSON
fig.write_json("grouped_horizontal_bar.plotly.json")