import plotly.express as px
import json

# Sample data
df = px.data.gapminder().query("country == 'Canada'")

# Create line chart
fig = px.line(df, x="year", y="gdpPercap", title="GDP per Capita of Canada")

# Export to plotly.json
with open("line_chart_basic.json", "w") as f:
    f.write(fig.to_json())
