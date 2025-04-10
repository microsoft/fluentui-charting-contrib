import pandas as pd
import plotly.express as px

data = {
    'Category': ['A', 'B', 'C'],
    'Value': [10, 20, 15]
}

fig = px.bar(
    data, 
    x="Value", 
    y="Category", 
    orientation="h", 
    hover_data={"Value": True, "Category": True},
    title="Custom Horizontal Bar Chart",
    color="Category"
)

with open("custom_bar.json", "w") as f:
    f.write(fig.to_json())

