```python
import plotly.express as px
import pandas as pd

# Sample data for visualization
data = {
    'month': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    'department': ['HR', 'Finance', 'DevOps', 'Sales', 'Marketing'],
    'resource_type': ['CPU', 'Memory', 'Storage'],
    'usage_percentage': [70, 80, 65, 75, 85, 60, 90, 70, 80, 65, 70, 85],
    'cost': [200, 210, 180, 220, 230, 170, 240, 210, 220, 200, 190, 230],
    'forecasted_growth': [10, 15, 8, 12, 20, 5, 25, 10, 15, 8, 10, 20]
}

# Transform data for visualization
df = pd.DataFrame(data)

# Line chart for historical trends
fig1 = px.line(df, x='month', y='usage_percentage', color='department', title='Cloud Resource Usage Over Time')
fig1_json = fig1.to_json()

# Bar chart for real-time usage patterns
fig2 = px.bar(df, x='department', y='usage_percentage', color='resource_type', title='Real-Time Usage Patterns by Department and Resource Type')
fig2_json = fig2.to_json()

# Scatter plot for cost analysis and forecasting
fig3 = px.scatter(df, x='cost', y='forecasted_growth', color='department', title='Cost Analysis and Forecasted Growth')
fig3_json = fig3.to_json()

# Save JSON chart schemas to a file
with open('plotly_charts.json', 'w') as f:
    f.write(fig1_json)
    f.write('\n')
    f.write(fig2_json)
    f.write('\n')
    f.write(fig3_json)

# Output the result
print("JSON schemas for the charts have been saved to plotly_charts.json")
```