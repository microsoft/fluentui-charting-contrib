import plotly.express as px
import pandas as pd
import json
import plotly.io as pio

# Sample data
df = pd.DataFrame({
    "theta": [0, 45, 90, 135, 180, 225, 270, 315],
    "r": [1, 2, 3, 4, 5, 4, 3, 2],
    "category": ["A", "A", "A", "A", "B", "B", "B", "B"]
})

# Create the scatter polar chart
fig = px.scatter_polar(df, r="r", theta="theta", color="category", symbol="category")

# Convert to Plotly JSON
plotly_json = fig.to_plotly_json()

# Optional: Convert JSON object to string
plotly_json_str = json.dumps(plotly_json, indent=2)

pio.write_json(fig, "scatter_polar.json")
