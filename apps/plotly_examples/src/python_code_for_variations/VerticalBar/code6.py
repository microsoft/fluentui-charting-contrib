import plotly.express as px
import plotly.io as pio

df = px.data.tips()  # Example dataset
fig = px.bar(df, y="day", x="total_bill", orientation="h")  # just for reference
pio.write_json(fig, "bar_horizontal.json")



