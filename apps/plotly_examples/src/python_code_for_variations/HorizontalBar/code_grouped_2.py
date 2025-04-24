import plotly.express as px
import pandas as pd
import json

# Create a sample DataFrame with more than 5 categories and more than 15 bar sets
categories = [f"Category {chr(65 + i)}" for i in range(6)]  # Category A to F
bar_sets = [f"Set {i+1}" for i in range(16)]  # Set 1 to Set 16

data = []
for bar_set in bar_sets:
    for category in categories:
        data.append({
            "Bar Set": bar_set,
            "Category": category,
            "Value": (hash(bar_set + category) % 10) + 1  # Random value between 1 and 10
        })

df = pd.DataFrame(data)

# Create the stacked horizontal bar chart
fig = px.bar(df, x="Value", y="Bar Set", color="Category", orientation="h", title="Stacked Horizontal Bar Chart")

# Convert the figure to JSON
fig.write_json("grouped_horizontal_bar_2.plotly.json")