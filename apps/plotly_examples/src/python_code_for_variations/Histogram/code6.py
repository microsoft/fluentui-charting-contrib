import plotly.express as px

df = px.data.tips()
fig = px.histogram(df, x="tip", cumulative=True, title="Cumulative Histogram")

with open("histogram_cumulative.json", "w") as f:
    f.write(fig.to_json())





