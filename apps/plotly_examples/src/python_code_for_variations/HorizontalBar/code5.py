import pandas as pd
import plotly.express as px

data = {
    'Category': ['A', 'B', 'C'],
    'Value': [10, 20, 15]
}
df = pd.DataFrame(data).sort_values(by="Value", ascending=True)
fig = px.bar(data, x="Value", y="Category", orientation="h", log_x=True)
with open("logscale_bar.json", "w") as f:
    f.write(fig.to_json())
