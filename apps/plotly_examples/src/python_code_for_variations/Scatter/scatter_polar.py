import plotly.express as px
import pandas as pd
import json
import plotly.io as pio

# Sample data
df = pd.DataFrame({
    'Category': ['A', 'B', 'C', 'D', 'E'],
    'Value': [10, 20, 15, 25, 5]
})

# Create polar scatter plot
fig = px.scatter_polar(
    df,
    r='Value',
    theta='Category',
    symbol='Category',  # Optional: show different symbols
    title='Scatter Polar Chart with Categorical Data'
)

# Convert to Plotly JSON
#plotly_json = fig.to_plotly_json()

# Optional: Convert JSON object to string
#plotly_json_str = json.dumps(plotly_json, indent=2)

pio.write_json(fig, "scatter_polar_categorical.json")
