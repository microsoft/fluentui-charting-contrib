import plotly.express as px
import json

# Sample data
df = px.data.gapminder().query("continent == 'Oceania'")

fig = px.line(df, x="year", y="gdpPercap", color="country", line_dash="country", title="Custom Line Styles")

with open("line_chart_dash.json", "w") as f:
    f.write(fig.to_json())

