import plotly.express as px
import plotly.io as pio

df = px.data.tips()  # Example dataset

fig = px.bar(df, x="day", y="total_bill", color="day", color_discrete_sequence=["red", "blue", "green", "orange"])
pio.write_json(fig, "bar_colored.json")


