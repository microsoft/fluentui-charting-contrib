import plotly.express as px
import pandas as pd
import json

# Create a DataFrame with realistic data for the scenario
data = {
    "school_name": ["School A", "School B", "School C", "School D"],
    "resources_allocated": [750000, 500000, 600000, 800000],
    "utilization_percentage": [85, 70, 90, 75],
    "student_to_resource_ratio": [20, 25, 18, 22]
}

df = pd.DataFrame(data)

# Create the visualizations
fig1 = px.bar(df, x="school_name", y="resources_allocated", title="Resources Allocated per School")
fig2 = px.scatter(df, x="resources_allocated", y="utilization_percentage", size="student_to_resource_ratio", title="Resource Utilization vs Allocation", labels={'utilization_percentage': 'Utilization (%)', 'resources_allocated': 'Resources Allocated ($)'})
fig3 = px.line(df, x="school_name", y="student_to_resource_ratio", title="Student-to-Resource Ratio per School")

# Generate Plotly JSON chart schemas
fig1_json = fig1.to_json()
fig2_json = fig2.to_json()
fig3_json = fig3.to_json()

# Save the JSON schemas to a file
with open("charts.json", "w") as f:
    json.dump({"fig1": fig1_json, "fig2": fig2_json, "fig3": fig3_json}, f)
