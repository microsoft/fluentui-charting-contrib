import plotly.express as px
import pandas as pd
import json

# Generating realistic data
data = {
    "employee_id": [f"E{i}" for i in range(1, 21)],  # 20 elements
    "shift_timing": (["Morning", "Afternoon", "Night"] * 7)[:20],  # Correctly truncate to 20 elements
    "task_completion_rate": [55, 60, 68, 75, 80, 85, 90, 92, 95, 98, 60, 58, 65, 70, 80, 85, 90, 88, 95, 97],  # 20 elements
    "overtime_hours": [5, 10, 2, 8, 6, 7, 4, 12, 3, 0, 8, 5, 13, 7, 12, 6, 9, 3, 5, 9]  # 20 elements
}
df = pd.DataFrame(data)

# Scatter plot showing relationship between task completion rate and overtime hours
fig_scatter = px.scatter(df, x='task_completion_rate', y='overtime_hours', color='shift_timing', title='Task Completion Rate vs Overtime Hours')

# Line chart showing weekly trend of task completion rate
df_line = df.groupby('shift_timing')['task_completion_rate'].mean().reset_index()
fig_line = px.line(df_line, x='shift_timing', y='task_completion_rate', title='Average Task Completion Rate by Shift Timing')

# Bar chart showing average task completion rate per shift timing
df_bar = df.groupby('shift_timing')['task_completion_rate'].mean().reset_index()
fig_bar = px.bar(df_bar, x='shift_timing', y='task_completion_rate', title='Average Task Completion Rate per Shift Timing')

# Function to save the fig to JSON
def save_fig_to_json(fig, filename):
    fig_json = fig.to_json()
    with open(filename, 'w') as f:
        json.dump(fig_json, f)

# Saving figures to JSON files
save_fig_to_json(fig_scatter, 'scatter_plot.json')
save_fig_to_json(fig_line, 'line_chart.json')
save_fig_to_json(fig_bar, 'bar_chart.json')