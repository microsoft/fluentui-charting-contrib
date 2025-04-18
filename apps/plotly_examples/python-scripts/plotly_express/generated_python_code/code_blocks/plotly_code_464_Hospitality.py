```python
import plotly.express as px
import pandas as pd
import json

# Sample Data
data = {
    'timestamp': pd.date_range(start='2023-09-01', end='2023-09-15', freq='D'),
    'room_number': ['R'+str(i) for i in range(101, 131)],
    'check_in_time': [15 + i % 5 for i in range(30)],
    'check_out_time': [11 + i % 4 for i in range(30)],
    'turnover_rate': [2 + i % 2 for i in range(30)],
    'maintenance_requests': [i % 5 for i in range(30)],
    'resolution_time': [30 + i % 15 for i in range(30)]
}

df = pd.DataFrame(data)

# Chart 1: Line chart showing average check-in and check-out times
fig1 = px.line(df, x='timestamp', y=['check_in_time', 'check_out_time'], title="Average Check-In and Check-Out Times")
fig1_json = fig1.to_json()

# Chart 2: Bar chart showing room turnover rates and maintenance requests
fig2 = px.bar(df, x='timestamp', y=['turnover_rate', 'maintenance_requests'], title="Room Turnover Rates and Maintenance Requests")
fig2_json = fig2.to_json()

# Chart 3: Scatter plot showing resolution times for maintenance requests
fig3 = px.scatter(df, x='timestamp', y='resolution_time', title="Resolution Times for Maintenance Requests", color='maintenance_requests')
fig3_json = fig3.to_json()

# Saving JSON schemas to file
charts = {"line_chart": fig1_json, "bar_chart": fig2_json, "scatter_chart": fig3_json}
with open("hospitality_operational_efficiency_dashboard.json", "w") as f:
    json.dump(charts, f)
```