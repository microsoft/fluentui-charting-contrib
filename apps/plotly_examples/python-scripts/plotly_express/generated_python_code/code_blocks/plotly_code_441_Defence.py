```python
import plotly.express as px
import pandas as pd
import json

# Generate realistic data
data = {
    'threat type': ['Malware', 'Phishing', 'DDoS', 'Ransomware', 'Malware', 'Phishing', 'DDoS', 'Ransomware'],
    'occurrence date': ['2023-01-15', '2023-02-10', '2023-03-05', '2023-04-20', '2023-05-15', '2023-06-10', '2023-07-05', '2023-08-20'],
    'response time': [5, 4, 6, 7, 5, 3, 8, 6],
    'impact score': [90, 80, 85, 70, 75, 60, 95, 80],
    'complexity': ['High', 'Medium', 'High', 'High', 'Low', 'Medium', 'Low', 'Medium']
}

df = pd.DataFrame(data)

# Visualization 1: Heatmap of Threat Types vs Impact Score
fig1 = px.density_heatmap(df, x='threat type', y='impact score', z='occurrence date', title='Heatmap of Threat Types vs Impact Score')
json_schema1 = fig1.to_json()

# Visualization 2: Temporal Analysis of Incident Resolutions
fig2 = px.line(df, x='occurrence date', y='response time', color='threat type', title='Temporal Analysis of Incident Resolutions')
json_schema2 = fig2.to_json()

# Visualization 3: Impact Score by Threat Type and Complexity
fig3 = px.bar(df, x='threat type', y='impact score', color='complexity', title='Impact Score by Threat Type and Complexity')
json_schema3 = fig3.to_json()

# Combine the JSON schemas into a dictionary
json_schemas = {
    'heatmap': json_schema1,
    'temporal_analysis': json_schema2,
    'impact_score_bar': json_schema3
}

# Save the JSON schemas to a file
with open('plotly_json_schemas.json', 'w') as f:
    json.dump(json_schemas, f)
```