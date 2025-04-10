import pandas as pd
import plotly.express as px
import plotly.io as pio

df = pd.DataFrame({
    "Fruit": ["Apple", "Banana", "Cherry", "Date"],
    "Quantity": [15, 25, 30, 10]
})
fig = px.pie(
    df, 
    names="Fruit", 
    values="Quantity", 
    color="Fruit",
    color_discrete_map={"Apple":"red", "Banana":"yellow", "Cherry":"darkred", "Date":"brown"}
)

pio.write_json(fig, "pie_chart_colored.json")
