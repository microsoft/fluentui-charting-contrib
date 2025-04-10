import plotly.express as px
import json

# Sample data
df = px.data.gapminder().query("continent == 'Oceania'")

fig = px.line(df, x="year", y="gdpPercap", color="country", markers=True, title="With Markers")

with open("line_chart_markers.json", "w") as f:
    f.write(fig.to_json())
