import plotly.express as px
import pandas as pd

df = px.data.gapminder().query("continent == 'Asia' and year >= 2000")

fig = px.area(df, x="year", y="pop", color="country", title="Asian Population by Country")

with open("area_stacked.json", "w") as f:
    f.write(fig.to_json())
