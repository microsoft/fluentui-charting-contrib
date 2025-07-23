import plotly.express as px
import json
import plotly.io as pio

# Data for the polar area chart
data = {
    "theta": ["A", "B", "C", "D", "E"],
    "r": [10, 20, 30, 40, 50],
}

# Create a polar area chart
fig = px.line_polar(
    data,
    r="r",
    theta="theta",
    line_close=True,
    title="Polar Area Chart",
    template="plotly"
)

plotly_json = fig.to_plotly_json()

pio.write_json(fig, "polar_area_chart.json")