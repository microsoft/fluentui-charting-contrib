```python
import plotly.express as px
import pandas as pd
import json

# Sample DataFrame
data = {
    "site_location": ["Site A", "Site A", "Site B", "Site B", "Site C", "Site C"],
    "incident_type": ["Fall", "Equipment", "Fall", "Equipment", "Fall", "Equipment"],
    "severity": ["High", "Medium", "Low", "High", "Medium", "Low"],
    "frequency": [5, 3, 2, 7, 4, 1],
    "inspection_reports": [4, 3, 1, 5, 2, 1],
    "week": ["2023-01-01", "2023-01-01", "2023-01-01", "2023-01-08", "2023-01-08", "2023-01-08"]
}

df = pd.DataFrame(data)

# Bar Chart for Incident Frequency by Site Location
fig1 = px.bar(df, x="site_location", y="frequency", color="incident_type", title="Weekly Incident Frequency by Site Location")
fig1_json = fig1.to_json()

# Line Chart for Inspection Reports Trend
fig2 = px.line(df, x="week", y="inspection_reports", color="site_location", title="Weekly Inspection Reports Trend")
fig2_json = fig2.to_json()

# Scatter Plot for Severity vs Frequency
fig3 = px.scatter(df, x="severity", y="frequency", color="incident_type", size="frequency", title="Incident Severity vs Frequency")
fig3_json = fig3.to_json()

# Save JSON schemas to a file
json_schemas = {
    "bar_chart": json.loads(fig1_json),
    "line_chart": json.loads(fig2_json),
    "scatter_plot": json.loads(fig3_json)
}

with open("site_safety_analytics.json", "w") as f:
    json.dump(json_schemas, f)
```