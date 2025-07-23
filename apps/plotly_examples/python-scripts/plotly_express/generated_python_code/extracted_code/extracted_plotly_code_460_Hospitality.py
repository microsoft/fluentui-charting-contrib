import json
import plotly.express as px
import pandas as pd
import numpy as np

# Generate realistic sample data
np.random.seed(42)
dates = pd.date_range(start="2023-01-01", end="2023-12-31", freq="D")
locations = ["Hotel A", "Hotel B", "Hotel C"]

data = {
    "date": np.tile(dates, len(locations)),
    "location": np.repeat(locations, len(dates)),
    "rooms_available": np.random.randint(50, 200, size=len(dates) * len(locations)),
    "rooms_occupied": np.random.randint(0, 150, size=len(dates) * len(locations)),
}

df = pd.DataFrame(data)
df["occupancy_rate"] = df["rooms_occupied"] / df["rooms_available"]

# Generate daily occupancy rates plot
fig_daily = px.line(
    df,
    x="date",
    y="occupancy_rate",
    color="location",
    title="Daily Occupancy Rates for Different Hotels",
    labels={"occupancy_rate": "Occupancy Rate", "date": "Date"},
)
fig_daily_json = json.loads(fig_daily.to_json())

# Generate monthly occupancy rates plot
df_monthly = df.groupby([pd.Grouper(key="date", freq="ME"), "location"]).mean().reset_index()
fig_monthly = px.bar(
    df_monthly,
    x="date",
    y="occupancy_rate",
    color="location",
    barmode="group",
    title="Monthly Average Occupancy Rates for Different Hotels",
    labels={"occupancy_rate": "Occupancy Rate", "date": "Date"},
)
fig_monthly_json = json.loads(fig_monthly.to_json())

# Generate scatter plot for rooms available vs rooms occupied
fig_scatter = px.scatter(
    df,
    x="rooms_available",
    y="rooms_occupied",
    color="location",
    trendline="ols",
    title="Rooms Available vs Rooms Occupied Over Time",
    labels={"rooms_available": "Rooms Available", "rooms_occupied": "Rooms Occupied"},
)
fig_scatter_json = json.loads(fig_scatter.to_json())

# Save JSON schemas to a file
with open("visualizations.json", "w") as f:
    json.dump({
        "daily_occupancy_rates": fig_daily_json,
        "monthly_occupancy_rates": fig_monthly_json,
        "rooms_available_vs_occupied": fig_scatter_json
    }, f)
