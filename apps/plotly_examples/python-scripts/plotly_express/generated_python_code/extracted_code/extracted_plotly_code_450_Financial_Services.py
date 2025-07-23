import plotly.express as px
import pandas as pd
import json
from plotly.utils import PlotlyJSONEncoder  # Import Plotly's JSON encoder

# Sample realistic data
data = {
    "Process ID": [1, 2, 3, 4, 5, 6],
    "Department": ["HR", "Finance", "IT", "Operations", "Customer Support", "Legal"],
    "Start": ["2022-01-01", "2022-01-15", "2022-02-01", "2022-02-10", "2022-03-01", "2022-03-05"],
    "Finish": ["2022-01-10", "2022-01-20", "2022-02-08", "2022-02-20", "2022-03-10", "2022-03-15"],
    "Time to Complete": [10, 5, 7, 10, 9, 10],
    "Error Rate": [0.02, 0.01, 0.05, 0.03, 0.04, 0.02]
}

df = pd.DataFrame(data)

# Gantt Chart for process timelines
fig_gantt = px.timeline(df, x_start="Start", x_end="Finish", y="Process ID", color="Department", title="Process Timelines - Operational Efficiency")
gantt_json_schema = json.dumps(fig_gantt.to_plotly_json(), cls=PlotlyJSONEncoder, indent=4)

# Line Chart for defect rate trends over time
df_line = pd.melt(df, id_vars=["Process ID", "Department", "Start"], value_vars=["Error Rate"], var_name="Metric", value_name="Rate")
fig_line = px.line(df_line, x="Start", y="Rate", color="Department", title="Defect Rate Trends Over Time")
line_json_schema = json.dumps(fig_line.to_plotly_json(), cls=PlotlyJSONEncoder, indent=4)

# Pie Chart for departmental contributions to inefficiencies
df_pie = df.groupby("Department").sum().reset_index()
fig_pie = px.pie(df_pie, values='Error Rate', names='Department', title='Departmental Contributions to Inefficiencies')
pie_json_schema = json.dumps(fig_pie.to_plotly_json(), cls=PlotlyJSONEncoder, indent=4)

output_data = {
    "gantt_chart": gantt_json_schema,
    "line_chart": line_json_schema,
    "pie_chart": pie_json_schema
}

# Save the JSON schemas to a file
with open("chart_schemas.json", "w") as f:
    json.dump(output_data, f, indent=4, cls=PlotlyJSONEncoder)