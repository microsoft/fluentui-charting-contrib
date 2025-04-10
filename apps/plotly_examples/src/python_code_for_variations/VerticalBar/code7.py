import plotly.express as px
import plotly.io as pio

df = px.data.tips()  # Example dataset
fig = px.bar(df, x="day", y="total_bill", hover_data=["tip", "sex"])
pio.write_json(fig, "bar_hover.json")




