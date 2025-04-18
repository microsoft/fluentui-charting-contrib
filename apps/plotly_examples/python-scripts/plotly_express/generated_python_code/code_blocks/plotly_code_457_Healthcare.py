```python
import plotly.express as px
import pandas as pd
import json

# Generate realistic sample data
data = {
    "Department": ["Cardiology", "Cardiology", "Cardiology", "Orthopedics", "Orthopedics", "Orthopedics",
                   "Neurology", "Neurology", "Neurology"],
    "Month": ["January", "February", "March", "January", "February", "March", "January", "February", "March"],
    "Staff_ID": [101, 101, 101, 102, 102, 102, 103, 103, 103],
    "Hours_Worked": [160, 158, 162, 165, 160, 168, 170, 160, 165],
    "Patients_Handled": [80, 85, 88, 75, 78, 83, 65, 70, 68],
    "Admissions": [200, 210, 220, 190, 200, 198, 180, 185, 178],
    "Discharges": [195, 205, 212, 185, 195, 190, 175, 180, 172],
    "Avg_Wait_Time": [15, 14, 16, 18, 17, 16, 20, 19, 18]
}

df = pd.DataFrame(data)

# Scatter plot: Staff Efficiency vs. Patient Throughput
fig_scatter = px.scatter(df, x="Patients_Handled", y="Avg_Wait_Time", color="Department",
                         title="Staff Efficiency vs. Average Patient Wait Time",
                         labels={"Patients_Handled": "Number of Patients Handled", "Avg_Wait_Time": "Average Patient Wait Time (minutes)"})

# Line chart: Monthly Admissions and Discharges
fig_line = px.line(df, x="Month", y=["Admissions", "Discharges"], color="Department",
                   title="Monthly Admissions and Discharges per Department",
                   labels={"value": "Count", "Month": "Month", "variable": "Throughput Metric"})

# Bar chart: Hours Worked vs. Patients Handled
fig_bar = px.bar(df, x="Hours_Worked", y="Patients_Handled", color="Department",
                 title="Hours Worked vs. Patients Handled per Department",
                 labels={"Hours_Worked": "Hours Worked", "Patients_Handled": "Number of Patients Handled"})

# Convert figures to JSON chart schemas and save to file
fig_scatter_json = fig_scatter.to_json()
fig_line_json = fig_line.to_json()
fig_bar_json = fig_bar.to_json()

with open("chart_schemas.json", "w") as f:
    json.dump({
        "scatter_chart": json.loads(fig_scatter_json),
        "line_chart": json.loads(fig_line_json),
        "bar_chart": json.loads(fig_bar_json)
    }, f)
```