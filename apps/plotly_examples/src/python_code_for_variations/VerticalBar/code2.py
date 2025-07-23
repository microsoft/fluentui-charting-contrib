import plotly.express as px
import plotly.io as pio

df = px.data.tips()  # Example dataset

fig = px.bar(df, x="day", y="total_bill", color="sex", barmode="group")
pio.write_json(fig, "bar_grouped.json")

