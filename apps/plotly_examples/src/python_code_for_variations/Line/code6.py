import pandas as pd
import plotly.express as px

# Custom data
data = {
    "Month": ["Jan", "Feb", "Mar", "Apr"],
    "Sales": [200, 250, 300, 280]
}
df = pd.DataFrame(data)

fig = px.line(df, x="Month", y="Sales", title="Monthly Sales")

with open("line_chart_custom.json", "w") as f:
    f.write(fig.to_json())
