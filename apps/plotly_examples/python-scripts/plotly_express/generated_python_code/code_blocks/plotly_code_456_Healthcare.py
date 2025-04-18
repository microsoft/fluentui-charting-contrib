```python
import plotly.express as px
import pandas as pd
import json

# Generate realistic data
data = {
    "facility_id": ["Hospital A", "Hospital B", "Hospital C", "Hospital D", "Hospital E"],
    "healthcare_spending": [2500000, 3000000, 1500000, 4000000, 2000000],
    "patient_satisfaction_score": [85, 88, 75, 90, 80]
}
df = pd.DataFrame(data)

# Scatter plot
fig1 = px.scatter(df, x="healthcare_spending", y="patient_satisfaction_score", color="facility_id",
                  title="Healthcare Spending vs Patient Satisfaction")
fig1_json = fig1.to_json()

# Bar chart
fig2 = px.bar(df, x="facility_id", y="healthcare_spending", color="patient_satisfaction_score",
              title="Healthcare Spending by Facility")
fig2_json = fig2.to_json()

# Line chart
fig3 = px.line(df.sort_values(by="healthcare_spending"), x="healthcare_spending", y="patient_satisfaction_score", 
               title="Trend of Healthcare Spending vs Patient Satisfaction", markers=True)
fig3_json = fig3.to_json()

# Save JSON schemas to file
with open('healthcare_spending_vs_patient_satisfaction.json', 'w') as f:
    json.dump({"scatter_plot": fig1_json, "bar_chart": fig2_json, "line_chart": fig3_json}, f)
```