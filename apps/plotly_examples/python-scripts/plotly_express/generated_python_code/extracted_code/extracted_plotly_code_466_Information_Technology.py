import plotly.express as px
import pandas as pd
import json

# Sample realistic data
data = {
    "week": ["2023-W1", "2023-W2", "2023-W3", "2023-W4", "2023-W5", "2023-W6", "2023-W7", "2023-W8"],
    "issue_resolution_times": [5, 7, 6, 4, 8, 5, 7, 6],
    "feature_request_completion_times": [12, 15, 10, 8, 16, 11, 13, 9],
    "defect_occurrences": [3, 5, 2, 6, 4, 3, 7, 5]
}

df = pd.DataFrame(data)

# Issue Resolution Times
fig1 = px.line(df, x='week', y='issue_resolution_times', title='Issue Resolution Times Over Weeks')
fig1_json = fig1.to_json()

# Feature Request Completion Times
fig2 = px.bar(df, x='week', y='feature_request_completion_times', title='Feature Request Completion Times Over Weeks')
fig2_json = fig2.to_json()

# Defect Occurrences
fig3 = px.scatter(df, x='week', y='defect_occurrences', title='Defect Occurrences Over Weeks')
fig3_json = fig3.to_json()

# Save JSON schemas to file
with open("plotly_charts.json", "w") as file:
    json.dump({
        "issue_resolution_times_chart": fig1_json,
        "feature_request_completion_times_chart": fig2_json,
        "defect_occurrences_chart": fig3_json
    }, file)
