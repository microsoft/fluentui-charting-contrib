import plotly.express as px
import pandas as pd
import json

# Example data to be used for the visualizations
data = {
    "drug_name": ["Drug A", "Drug B", "Drug C", "Drug D", "Drug E"],
    "quantity_dispensed": [500, 300, 800, 200, 400],
    "compliance_rate": [0.85, 0.75, 0.90, 0.60, 0.80],
    "adverse_effects_incidence": [0.05, 0.08, 0.03, 0.12, 0.07]
}

# Convert dictionary to DataFrame
df = pd.DataFrame(data)

# Create three different charts suitable for the scenario
charts = []

# Chart 1: Bar chart for drug utilization (quantity dispensed)
fig1 = px.bar(df, x="drug_name", y="quantity_dispensed", title="Quantity Dispensed by Drug")
charts.append(fig1)

# Chart 2: Line chart for compliance rates
fig2 = px.line(df, x="drug_name", y="compliance_rate", title="Compliance Rates by Drug")
charts.append(fig2)

# Chart 3: Scatter plot for adverse effects incidence
fig3 = px.scatter(df, x="drug_name", y="adverse_effects_incidence", title="Adverse Effects Incidence by Drug")
charts.append(fig3)

# Generate Plotly JSON chart schemas and save to file
chart_schemas = [chart.to_json() for chart in charts]

with open('chart_schemas.json', 'w') as f:
    json.dump(chart_schemas, f)
