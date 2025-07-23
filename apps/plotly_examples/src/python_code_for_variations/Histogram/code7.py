import plotly.express as px

df = px.data.tips()
fig = px.density_heatmap(df, x="total_bill", y="tip", nbinsx=20, nbinsy=20, title="2D Histogram")

with open("histogram_2d.json", "w") as f:
    f.write(fig.to_json())






