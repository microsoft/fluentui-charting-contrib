import pandas as pd
import plotly.express as px

data = {
    'Category': ['A', 'B', 'C'],
    'Value': [10, 20, 15]
}

df = pd.DataFrame(data).sort_values(by="Value", ascending=True)

fig = px.bar(df, x="Value", y="Category", orientation="h")
with open("sorted_bar.json", "w") as f:
    f.write(fig.to_json())
