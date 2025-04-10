import pandas as pd
import plotly.express as px

df = pd.DataFrame({
    "Category": ["A", "A", "B", "B", "C", "C"],
    "Subcategory": ["X", "Y"] * 3,
    "Value": [5, 5, 10, 10, 7, 8]
})

fig = px.bar(df, x="Value", y="Category", color="Subcategory", orientation="h")
with open("stacked_bar.json", "w") as f:
    f.write(fig.to_json())
