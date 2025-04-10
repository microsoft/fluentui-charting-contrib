import pandas as pd
import plotly.express as px
import plotly.io as pio

df = pd.DataFrame({
    "Fruit": ["Apple", "Banana", "Cherry", "Date"],
    "Quantity": [15, 25, 30, 10]
})

fig = px.pie(df, names="Fruit", values="Quantity", title="Fruits Distribution")

pio.write_json(fig, "pie_chart_dataframe.json")
