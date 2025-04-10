import plotly.express as px
import pandas as pd

df = px.data.tips()

fig = px.density_heatmap(df, x="day", y="sex", z="tip", histfunc="avg")

with open("heatmap_aggregated.json", "w") as f:
    f.write(fig.to_json())
