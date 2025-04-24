import plotly.express as px
import pandas as pd
import json

# Specifying realistic data for the scenario
data = {
    "operation ID": ["Op1", "Op2", "Op3", "Op4", "Op5"],
    "operation type": ["Recon", "Defense", "Attack", "Patrol", "Defense"],
    "resource type": ["Personnel", "Equipment", "Personnel", "Equipment", "Personnel"],
    "allocated quantity": [150, 300, 200, 120, 350],
    "required quantity": [180, 250, 250, 100, 360],
    "mission priority": ["High", "Medium", "High", "Low", "Medium"]
}

df = pd.DataFrame(data)

# Bar Chart - Allocation vs Required Comparison
fig_bar = px.bar(df, x="operation type", y=["allocated quantity", "required quantity"], color="mission priority",
                 title="Allocation vs Required Comparison by Operation Type and Priority Level")

# Save the JSON schema for the bar chart
fig_bar_json = fig_bar.to_json()
with open("bar_chart.json", "w") as f:
    f.write(fig_bar_json)

# Scatter Plot - Allocation against Mission Priority
fig_scatter = px.scatter(df, x="allocated quantity", y="required quantity", color="mission priority",
                         size="allocated quantity", hover_data=["operation type", "operation ID"],
                         title="Scatter Plot of Allocated vs Required Quantity by Mission Priority")

# Save the JSON schema for the scatter plot
fig_scatter_json = fig_scatter.to_json()
with open("scatter_plot.json", "w") as f:
    f.write(fig_scatter_json)

# Pie Chart - Distribution of Resources by Operation Type
fig_pie = px.pie(df, names="operation type", values="allocated quantity", color="mission priority",
                 title="Distribution of Resources by Operation Type")

# Save the JSON schema for the pie chart
fig_pie_json = fig_pie.to_json()
with open("pie_chart.json", "w") as f:
    f.write(fig_pie_json)
