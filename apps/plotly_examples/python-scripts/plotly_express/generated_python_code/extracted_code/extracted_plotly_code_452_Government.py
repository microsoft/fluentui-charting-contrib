import plotly.express as px
import json
import pandas as pd

# Create realistic data
counties = ["County A", "County B", "County C", "County D", "County E"]
season = ["Winter", "Spring", "Summer", "Fall"]
pollutants = ["CO2", "SO2", "NOx", "PM2.5", "O3"]
air_quality = [
    {"county": county, "season": sea, "CO2": val, "SO2": val/2, "NOx": val/3, "PM2.5": val/4, "O3": val/5}
    for county in counties
    for sea, val in zip(season, range(50, 100, 10))
]
water_quality = [
    {"county": county, "season": sea, "pollution_level": val}
    for county in counties
    for sea, val in zip(season, range(20, 70, 10))
]

# Convert to appropriate data frames
df_air_quality = px.data.tips()
df_air_quality = pd.DataFrame(air_quality)
df_water_quality = px.data.tips()
df_water_quality = pd.DataFrame(water_quality)

# Create visualizations and convert them to JSON schemas
fig1 = px.line(df_air_quality, x="season", y=["CO2", "SO2", "NOx", "PM2.5", "O3"], color="county", title="Seasonal Air Quality Metrics")
fig1_json = fig1.to_json()

fig2 = px.bar(df_air_quality, x="county", y=["CO2", "SO2", "NOx", "PM2.5", "O3"], title="Air Quality by County")
fig2_json = fig2.to_json()

fig3 = px.scatter(df_water_quality, x="season", y="pollution_level", color="county", size="pollution_level", title="Seasonal Water Pollution Levels")
fig3_json = fig3.to_json()

# Save JSON schemas to file
with open('chart_schemas.json', 'w') as f:
    json.dump({"line_chart": fig1_json, "bar_chart": fig2_json, "scatter_chart": fig3_json}, f)
