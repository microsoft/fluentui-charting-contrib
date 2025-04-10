import plotly.express as px

df = px.data.tips()
fig = px.histogram(df, x="tip", histnorm="probability density", title="Normalized Histogram (Density)")

with open("histogram_normalized.json", "w") as f:
    f.write(fig.to_json())




