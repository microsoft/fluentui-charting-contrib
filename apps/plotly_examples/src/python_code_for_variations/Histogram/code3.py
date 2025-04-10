import plotly.express as px

df = px.data.tips()
fig = px.histogram(df, x="total_bill", nbins=10, title="Histogram with Custom Bins")

with open("histogram_custom_bins.json", "w") as f:
    f.write(fig.to_json())



