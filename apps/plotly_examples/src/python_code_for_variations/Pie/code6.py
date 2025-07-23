import pandas as pd
import plotly.express as px
import plotly.io as pio

df = pd.DataFrame({
    "Fruit": ["Apple", "Banana", "Cherry", "Date"],
    "Quantity": [15, 25, 30, 10]
})
fig = px.pie(
    names=["Python", "Java", "C++", "JavaScript"],
    values=[30, 25, 20, 25],
    title="Programming Languages Popularity"
)

pio.write_json(fig, "inline_data_pie_chart.json")
