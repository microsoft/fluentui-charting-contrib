import pandas as pd
import plotly.express as px
import plotly.io as pio

df = pd.DataFrame({
    "Fruit": ["Apple", "Banana", "Cherry", "Date"],
    "Quantity": [15, 25, 30, 10]
})
fig = px.pie(df, names="Fruit", values="Quantity")
fig.update_traces(pull=[0.1, 0.2, 0, 0], title="Exploded Pie Chart")

pio.write_json(fig, "exploded_pie_chart.json")
