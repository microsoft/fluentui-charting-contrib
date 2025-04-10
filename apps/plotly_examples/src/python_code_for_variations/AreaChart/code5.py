import plotly.express as px
import pandas as pd

df = px.data.gapminder().query("continent == 'Asia' and year >= 2000")
fig = px.area(df, x="year", y="pop", color="country", facet_col="country", facet_col_wrap=3)

with open("area_faceted.json", "w") as f:
    f.write(fig.to_json())


