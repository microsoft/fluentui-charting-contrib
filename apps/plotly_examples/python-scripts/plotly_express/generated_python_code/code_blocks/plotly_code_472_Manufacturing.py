```python
import plotly.express as px
import json
import pandas as pd
import random

# Generate realistic data
data = {
    'date': pd.date_range(start='2023-01-01', end='2023-01-15', freq='D'),
    'defect_rate': [random.uniform(0, 0.1) for _ in range(15)],
    'type_of_defect': [random.choice(['Scratch', 'Dent', 'Discoloration', 'Misalignment']) for _ in range(15)],
    'production_line': [random.choice(['Line A', 'Line B', 'Line C', 'Line D']) for _ in range(15)],
    'batch_number': [random.randint(1000, 1100) for _ in range(15)],
    'operator': [random.choice(['Operator X', 'Operator Y', 'Operator Z']) for _ in range(15)]
}

df = pd.DataFrame(data)

# Visualization 1: Histogram of Defect Rates
fig1 = px.histogram(df, x='defect_rate', nbins=10, title='Histogram of Defect Rates')
fig1_json = json.dumps(fig1.to_plotly_json())

# Visualization 2: Pareto Chart of Defect Types
df_defect_count = df['type_of_defect'].value_counts().reset_index()
df_defect_count.columns = ['type_of_defect', 'count']
df_defect_count['cumulative_percentage'] = df_defect_count['count'].cumsum() / df_defect_count['count'].sum() * 100
fig2 = px.bar(df_defect_count, x='type_of_defect', y='count', title='Pareto Chart of Defect Types', text='count')
fig2.add_scatter(x=df_defect_count['type_of_defect'], y=df_defect_count['cumulative_percentage'], mode='lines+markers', name='Cumulative Percentage')
fig2_json = json.dumps(fig2.to_plotly_json())

# Visualization 3: Line Chart of Defect Rate Trends over Time
fig3 = px.line(df, x='date', y='defect_rate', title='Defect Rate Trends over Time', markers=True)
fig3_json = json.dumps(fig3.to_plotly_json())

# Save JSON schemas to file
with open('chart_schemas.json', 'w') as f:
    json.dump({'histogram_defect_rate': fig1_json, 'pareto_defect_types': fig2_json, 'line_defect_rate_trends': fig3_json}, f)
```