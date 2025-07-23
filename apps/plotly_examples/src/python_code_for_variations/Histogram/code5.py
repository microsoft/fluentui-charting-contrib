import plotly.express as px

df = px.data.tips()
fig = px.histogram(df, x="total_bill", facet_col="sex", title="Faceted Histogram by Sex")

with open("histogram_faceted.json", "w") as f:
    f.write(fig.to_json())




