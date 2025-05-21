import plotly.express as px
import pandas as pd
import json

# Generating realistic data
data = {
    "ticket_id": [f"TKT{str(i).zfill(4)}" for i in range(1, 101)],
    "time_to_resolution": [i % 10 + 1 for i in range(1, 101)],  # Random resolution time between 1 to 10 hours
    "satisfaction_score": [i % 5 + 1 for i in range(1, 101)],   # Random satisfaction score between 1 to 5
    "resolution_method": ["Chat", "Email", "Phone", "Self-Service"] * 25,  # Four different resolution methods
    "issue_type": ["Software", "Hardware", "Network", "Access"] * 25,  # Four issue types
    "priority": ["High", "Medium", "Low"] * 33 + ["High"],  # Three priority levels
    "technician": [f"Tech{str(i % 5 + 1)}" for i in range(1, 101)]  # Five technicians
}
df = pd.DataFrame(data)

# 1. Bar chart showing average time to resolution by issue type
fig1 = px.bar(df, x="issue_type", y="time_to_resolution", title="Average Time to Resolution by Issue Type", 
              labels={"time_to_resolution": "Time to Resolution (hours)"},
              color="issue_type", barmode="group",
              category_orders={"issue_type": ["Software", "Hardware", "Network", "Access"]})
json_schema1 = fig1.to_json()

# 2. Scatter plot showing satisfaction score by technician, colored by resolution method
fig2 = px.scatter(df, x="technician", y="satisfaction_score", title="Satisfaction Score by Technician", 
                  labels={"satisfaction_score": "Satisfaction Score", "technician": "Technician"},
                  color="resolution_method", size="time_to_resolution")
json_schema2 = fig2.to_json()

# 3. Line chart showing the trend of average monthly resolution time
df['month'] = pd.date_range(start="2023-01-01", periods=100, freq='D').month
monthly_data = df.groupby('month').agg({'time_to_resolution': 'mean'}).reset_index()
fig3 = px.line(monthly_data, x="month", y="time_to_resolution", title="Monthly Trend of Average Resolution Time",
               labels={"time_to_resolution": "Average Time to Resolution (hours)", "month": "Month"})
json_schema3 = fig3.to_json()

# Saving the JSON schemas to file
with open("charts.json", "w") as f:
    json.dump({"bar_chart_by_issue_type": json_schema1, "scatter_plot_by_technician": json_schema2, "line_chart_monthly_trend": json_schema3}, f)
