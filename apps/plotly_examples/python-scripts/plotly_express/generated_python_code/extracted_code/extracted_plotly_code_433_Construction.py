import plotly.express as px
import pandas as pd

# Create realistic data
data = {
    "project_id": ["P1", "P2", "P3", "P4", "P5"],
    "month": ["Jan", "Feb", "Mar", "Apr", "May"],
    "phase": ["Planning", "Execution", "Completion", "Execution", "Planning"],
    "budgeted_cost": [100000, 150000, 200000, 130000, 180000],
    "actual_cost": [110000, 140000, 190000, 125000, 175000],
    "variance_percentage": [10, -6.67, -5, -3.85, -2.78],
    "material_cost_escalation": [3, 7, 5, 6, 4],
    "labor_cost_variations": [2, 4, 3, 1, 5]
}

df = pd.DataFrame(data)

# Chart 1: Bar chart for budgeted and actual costs by project
fig1 = px.bar(df, x='project_id', y=['budgeted_cost', 'actual_cost'], title="Budgeted vs Actual Costs by Project")
fig1_json = fig1.to_json()

# Chart 2: Scatter plot for variance percentage by project phase
fig2 = px.scatter(df, x='phase', y='variance_percentage', color='project_id', title="Variance Percentage by Project Phase")
fig2_json = fig2.to_json()

# Chart 3: Line chart for monthly material cost escalation and labor cost variations
fig3 = px.line(df, x='month', y=['material_cost_escalation', 'labor_cost_variations'], title="Monthly Material Cost Escalation and Labor Cost Variations")
fig3_json = fig3.to_json()

# Save the JSON schemas to a file
with open('plotly_json_schemas.json', 'w') as f:
    f.write(f'{{"fig1": {fig1_json}, "fig2": {fig2_json}, "fig3": {fig3_json}}}')
