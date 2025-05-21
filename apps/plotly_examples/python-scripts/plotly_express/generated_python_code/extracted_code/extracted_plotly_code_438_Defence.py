import plotly.express as px
import pandas as pd
import json

# Generate some realistic sample data
data = {
    "ship ID": ["Ship_1", "Ship_2", "Ship_3", "Ship_4", "Ship_5"],
    "last maintenance date": ["2023-09-01", "2023-09-15", "2023-08-30", "2023-09-10", "2023-09-20"],
    "downtime duration": [3, 5, 2, 4, 7],
    "parts replaced": [4, 7, 3, 5, 8],
    "fleet": ["Fleet_A", "Fleet_B", "Fleet_A", "Fleet_C", "Fleet_B"],
    "region": ["Region_1", "Region_2", "Region_1", "Region_3", "Region_2"]
}

df = pd.DataFrame(data)

# Chart 1: Bar chart - Maintenance completion rates by fleet
fig1 = px.bar(df, x="fleet", y="downtime duration", title="Maintenance Completion Rates by Fleet", color="region")
fig1_json = fig1.to_json()

# Chart 2: Line chart - Projected maintenance needs based on historical data
df["date"] = pd.to_datetime(df["last maintenance date"])
df["week"] = df["date"].dt.strftime('%Y-%U')
fig2 = px.line(df, x="week", y="parts replaced", title="Projected Maintenance Needs", color="fleet")
fig2_json = fig2.to_json()

# Chart 3: Pie chart - Distribution of maintenance by region
fig3 = px.pie(df, names="region", values="downtime duration", title="Maintenance Distribution by Region")
fig3_json = fig3.to_json()

# Saving JSON schemas to a file
with open('plotly_chart_schemas.json', 'w') as f:
    json.dump({"chart1": fig1_json, "chart2": fig2_json, "chart3": fig3_json}, f)
