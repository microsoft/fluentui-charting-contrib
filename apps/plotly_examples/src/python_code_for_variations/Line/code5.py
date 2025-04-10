import plotly.express as px
import json

df = px.data.gapminder().query("continent == 'Asia' and year >= 1980")

fig = px.line(df, x="year", y="lifeExp", color="country", facet_col="country", facet_col_wrap=4,
              title="Life Expectancy by Country (Asia)")

with open("line_chart_facet.json", "w") as f:
    f.write(fig.to_json())


