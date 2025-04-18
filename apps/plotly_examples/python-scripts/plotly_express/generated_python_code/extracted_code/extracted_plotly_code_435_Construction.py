import pandas as pd
import plotly.express as px
import plotly.io as pio

data = {
    "Date": pd.date_range(start="2023-01-01", end="2023-01-10"),
    "Project_Site": ["Site A", "Site B", "Site C", "Site A", "Site B", "Site C", "Site A", "Site B", "Site C", "Site A"],
    "Resource_Type": ["Labor", "Machinery", "Materials", "Labor", "Machinery", "Materials", "Labor", "Machinery", "Materials", "Labor"],
    "Availability": [80, 70, 90, 85, 75, 95, 78, 68, 88, 82],
    "Usage": [60, 50, 75, 70, 65, 80, 58, 48, 70, 66],
    "Forecasted_Demand": [70, 60, 85, 78, 68, 88, 65, 55, 80, 72]
}

df = pd.DataFrame(data)

# Heatmap for resource availability
fig1 = px.density_heatmap(df, x="Resource_Type", y="Project_Site", z="Availability", title="Resource Availability Heatmap")
fig1_json = pio.to_json(fig1)

# Line chart for usage trends over time
fig2 = px.line(df, x="Date", y="Usage", color="Resource_Type", title="Resource Usage Trends Over Time")
fig2_json = pio.to_json(fig2)

# Bar chart for forecasted resource demand versus availability
fig3 = px.bar(df, x="Resource_Type", y=["Availability", "Forecasted_Demand"], barmode="group", title="Forecasted Demand vs Availability by Resource Type")
fig3_json = pio.to_json(fig3)

# Save JSON schemas to file
with open("resource_optimization_report.json", "w") as f:
    f.write(fig1_json)
    f.write("\n")
    f.write(fig2_json)
    f.write("\n")
    f.write(fig3_json)
