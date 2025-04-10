import pandas as pd
import plotly.express as px
import plotly.io as pio

df = pd.DataFrame({
    "Fruit": ["Apple", "Banana", "Cherry", "Date"],
    "Quantity": [15, 25, 30, 10]
})
fig = px.pie(df, names="Fruit", values="Quantity", hole=0.4, title="Donut Chart")

pio.write_json(fig, "donut_chart.json")
