```python
import plotly.express as px
import pandas as pd
import json

# Create realistic data
data = {
    'portfolio_id': ['P1', 'P1', 'P1', 'P2', 'P2', 'P2', 'P3', 'P3', 'P3'],
    'asset_type': ['Stock', 'Bond', 'Real Estate', 'Stock', 'Bond', 'Real Estate', 'Stock', 'Bond', 'Real Estate'],
    'date': ['2023-01-01', '2023-02-01', '2023-03-01', '2023-01-01', '2023-02-01', '2023-03-01', '2023-01-01', '2023-02-01', '2023-03-01'],
    'market_value': [100000, 105000, 103000, 150000, 156000, 155000, 200000, 205000, 202000],
    'return_percentage': [5, -2, 3, 4, -1, 2, 2.5, -1.5, 3.5]
}
df = pd.DataFrame(data)

# Create chart 1: Line chart showing market value over time for each portfolio
fig1 = px.line(df, x='date', y='market_value', color='portfolio_id', title='Market Value Over Time by Portfolio ID')

# Create chart 2: Bar chart showing return percentage by asset type
fig2 = px.bar(df, x='asset_type', y='return_percentage', color='portfolio_id', title='Return Percentage by Asset Type')

# Create chart 3: Scatter plot showing market value vs. return percentage
fig3 = px.scatter(df, x='market_value', y='return_percentage', color='portfolio_id', title='Market Value vs. Return Percentage')

# Save the JSON schemas
charts = [fig1, fig2, fig3]
schemas = [json.loads(fig.to_json()) for fig in charts]

with open('portfolio_performance_dashboard.json', 'w') as f:
    json.dump(schemas, f)
```