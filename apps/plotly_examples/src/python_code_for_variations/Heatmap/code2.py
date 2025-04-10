import plotly.express as px
import pandas as pd

df = px.data.tips()

fig = px.density_heatmap(df, x="total_bill", y="tip", nbinsx=20, nbinsy=20)

# Export to JSON
with open("heatmap_density_raw.json", "w") as f:
    f.write(fig.to_json())
