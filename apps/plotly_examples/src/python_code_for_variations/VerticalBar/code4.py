import plotly.express as px
import plotly.io as pio

df = px.data.tips()  # Example dataset

sorted_df = df.groupby("day")["total_bill"].sum().reset_index().sort_values("total_bill")
fig = px.bar(sorted_df, x="day", y="total_bill")
pio.write_json(fig, "bar_sorted.json")


