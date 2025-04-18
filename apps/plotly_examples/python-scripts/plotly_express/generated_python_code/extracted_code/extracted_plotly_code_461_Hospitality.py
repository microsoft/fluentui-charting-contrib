import plotly.express as px
import pandas as pd
import json

# Generate realistic data
data = {
    'booking_date': pd.date_range(start='2023-01-01', periods=180, freq='D'),
    'check_in_date': pd.date_range(start='2023-01-02', periods=180, freq='D'),
    'room_type': ['Single', 'Double', 'Suite'] * 60,
    'price': abs(100 + 50 * pd.Series(range(180)).isin([1, 55, 110])),
    'total_revenue': abs(1000 + 200 * pd.Series(range(180)).isin([1, 55, 110])),
    'hotel': ['Hotel A', 'Hotel B', 'Hotel C'] * 60,
    'region': ['North', 'South', 'East', 'West'] * 45
}

df = pd.DataFrame(data)

# Aggregating data by week and month
df['week'] = pd.to_datetime(df['booking_date']).dt.to_period('W').apply(lambda r: r.start_time)
df['month'] = pd.to_datetime(df['booking_date']).dt.to_period('M').apply(lambda r: r.start_time)

weekly_data = df.groupby(['week', 'hotel', 'room_type'])['total_revenue'].sum().reset_index()
monthly_data = df.groupby(['month', 'hotel', 'room_type'])['total_revenue'].sum().reset_index()

# Line Graph - Weekly Revenue Trend
fig1 = px.line(weekly_data, x='week', y='total_revenue', color='hotel', line_dash='room_type',
               title='Weekly Revenue Trend by Hotel and Room Type')

fig1_json = fig1.to_json()
with open('weekly_revenue_trend.json', 'w') as f:
    json.dump(fig1_json, f)

# Bar Chart - Monthly Revenue by Hotel
fig2 = px.bar(monthly_data, x='month', y='total_revenue', color='hotel',
              title='Monthly Revenue by Hotel', barmode='group')

fig2_json = fig2.to_json()
with open('monthly_revenue_by_hotel.json', 'w') as f:
    json.dump(fig2_json, f)

# Sunburst Chart - Total Revenue by Region, Hotel, and Room Type
fig3 = px.sunburst(df, path=['region', 'hotel', 'room_type'], values='total_revenue',
                   title='Total Revenue by Region, Hotel, and Room Type')

fig3_json = fig3.to_json()
with open('total_revenue_sunburst.json', 'w') as f:
    json.dump(fig3_json, f)
