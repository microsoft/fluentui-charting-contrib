import plotly.express as px
import json

# Sample data
df = px.data.gapminder().query("continent == 'Oceania'")

fig = px.line(df, x="year", y="gdpPercap", color="country", title="GDP per Capita in Oceania")

with open("multi_line_chart.json", "w") as f:
    f.write(fig.to_json())
