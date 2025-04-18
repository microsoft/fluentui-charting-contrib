```python
import plotly.express as px
import pandas as pd
import json

# Creating sample data
data = {
    'date': pd.date_range(start='2022-01-01', periods=24, freq='M'),
    'occupancy_rate': [50, 60, 55, 65, 70, 75, 65, 80, 85, 90, 85, 70, 65, 60, 55, 75, 80, 70, 75, 85, 90, 95, 80, 70],
    'booking_lead_time': [15, 20, 18, 25, 30, 35, 28, 40, 45, 50, 42, 35, 25, 20, 18, 30, 35, 28, 30, 45, 50, 55, 40, 30],
    'weather_condition': ['sunny', 'rainy', 'cloudy', 'sunny', 'sunny', 'cloudy', 'rainy', 'sunny', 'rainy', 'sunny', 'cloudy', 'sunny', 'sunny', 'cloudy', 'rainy', 'sunny', 'cloudy', 'sunny', 'rainy', 'sunny', 'sunny', 'cloudy', 'rainy', 'sunny'],
    'event_dates': [0, 1, 0, 2, 3, 2, 1, 4, 5, 3, 2, 0, 1, 0, 2, 3, 4, 3, 2, 2, 3, 4, 1, 3]
}

df = pd.DataFrame(data)

# Visualization 1: Time Series Graph for Occupancy Rate
fig1 = px.line(df, x='date', y='occupancy_rate', title='Occupancy Rate Over Time')
fig1_json = fig1.to_json()

# Visualization 2: Scatter Plot showing Booking Lead Time vs Occupancy Rate
fig2 = px.scatter(df, x='booking_lead_time', y='occupancy_rate', color='weather_condition', title='Booking Lead Time vs Occupancy Rate')
fig2_json = fig2.to_json()

# Visualization 3: Heatmap showing Event Dates Influence on Occupancy Rate
df_heatmap = df.pivot_table(index='date', columns='event_dates', values='occupancy_rate', fill_value=0)
fig3 = px.imshow(df_heatmap, title='Event Dates Influence on Occupancy Rate')
fig3_json = fig3.to_json()

# Save JSON schemas to file
json_schemas = {
    "chart1": json.loads(fig1_json),
    "chart2": json.loads(fig2_json),
    "chart3": json.loads(fig3_json)
}

with open('plotly_schemas.json', 'w') as f:
    json.dump(json_schemas, f)
```