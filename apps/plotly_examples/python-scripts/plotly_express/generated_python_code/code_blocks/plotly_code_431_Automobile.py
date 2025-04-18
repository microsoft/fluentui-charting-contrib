```python
import plotly.express as px
import pandas as pd

# Create realistic data
data = {
    'Defect Type': ['Paint Issue', 'Engine Fault', 'Transmission', 'Electrical', 'Safety Issue'],
    'Frequency': [50, 30, 20, 25, 10],
    'Production Batch': ['Batch A', 'Batch B', 'Batch C', 'Batch D', 'Batch E'],
    'Resolution Time (days)': [5, 8, 6, 7, 4]
}
df = pd.DataFrame(data)

# Visualization 1: Bar chart for Defect Types and their frequency
fig1 = px.bar(df, x='Defect Type', y='Frequency', title='Defects Frequency per Type')
fig1_json = fig1.to_json()

# Visualization 2: Scatter plot for Resolution Time vs Defects Frequency
fig2 = px.scatter(df, x='Frequency', y='Resolution Time (days)', color='Defect Type',
                  title='Resolution Time vs Defects Frequency')
fig2_json = fig2.to_json()

# Visualization 3: Pie chart for Defect Types
fig3 = px.pie(df, names='Defect Type', values='Frequency', title='Defects Distribution by Type')
fig3_json = fig3.to_json()

# Save JSON schemas to a file
with open('visualizations.json', 'w') as f:
    f.write(fig1_json)
    f.write("\n")
    f.write(fig2_json)
    f.write("\n")
    f.write(fig3_json)
```