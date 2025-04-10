import plotly.express as px
import pandas as pd

df = px.data.gapminder().query("country == 'Canada'")

fig = px.area(df, x="year", y="pop", title="Population of Canada")

# Export to JSON
with open("area_simple.json", "w") as f:
    f.write(fig.to_json())
