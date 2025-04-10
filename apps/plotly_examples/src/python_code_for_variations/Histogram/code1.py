import plotly.express as px

df = px.data.tips()
fig = px.histogram(df, x="total_bill", title="Histogram of Total Bill")

with open("histogram_basic.json", "w") as f:
    f.write(fig.to_json())

