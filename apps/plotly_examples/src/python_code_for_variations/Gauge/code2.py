import plotly.express as px
import plotly.graph_objects as go
import numpy as np

# Data
values = [30, 20, 10, 40]  # Percentages or values
labels = ["Low", "Medium", "High", "Empty"]
colors = ['green', 'yellow', 'red', 'lightgray']

# Pie chart
fig = go.Figure(go.Pie(
    values=values,
    labels=labels,
    marker_colors=colors,
    hole=0.5,
    direction='clockwise',
    rotation=180,
    textinfo='label+percent'
))

# Make it a half pie
fig.update_layout(
    title_text="Simulated Gauge",
    showlegend=False,
    annotations=[dict(text='60%', x=0.5, y=0.5, font_size=20, showarrow=False)],
    margin=dict(t=50, b=0, l=0, r=0),
)

fig.update_traces(sort=False)

# Save to JSON
fig.write_json("simulated_gauge_pie.plotly.json")