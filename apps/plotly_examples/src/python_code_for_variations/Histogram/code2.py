import plotly.express as px

df = px.data.tips()
fig = px.histogram(df, x="total_bill", color="sex", barmode="overlay", title="Histogram Grouped by Sex")

with open("histogram_grouped.json", "w") as f:
    f.write(fig.to_json())


