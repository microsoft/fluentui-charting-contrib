```python
import plotly.express as px
import json

# Generate sample data
import pandas as pd
import numpy as np

np.random.seed(0)
data = {
    'customer_id': range(1, 101),
    'credit_score': np.random.normal(600, 100, 100).astype(int),
    'outstanding_balance': np.random.normal(5000, 2000, 100).astype(int),
    'payment_history': np.random.choice(['On-time', 'Late', 'Default'], 100),
    'loan_type': np.random.choice(['Home Loan', 'Car Loan', 'Personal Loan'], 100),
    'age': np.random.normal(35, 10, 100).astype(int),
    'income_level': np.random.choice(['Low', 'Medium', 'High'], 100),
    'region': np.random.choice(['North', 'South', 'East', 'West'], 100)
}

df = pd.DataFrame(data)

# 1. Risk Distribution Histogram
fig_histogram = px.histogram(df, x='credit_score', color='payment_history', title='Credit Score Distribution by Payment History')
histogram_json = fig_histogram.to_json()

# 2. Credit Utilization Line Graph
df_credit_utilization = df.groupby('loan_type').agg({'outstanding_balance': 'mean'}).reset_index()
fig_line = px.line(df_credit_utilization, x='loan_type', y='outstanding_balance', title='Average Outstanding Balance by Loan Type')
line_json = fig_line.to_json()

# 3. Cohort Analysis
fig_cohort = px.scatter(df, x='credit_score', y='outstanding_balance', color='income_level', title='Credit Score vs Outstanding Balance by Income Level')
cohort_json = fig_cohort.to_json()

# Save the JSON schemas to a file
with open('credit_risk_assessment_charts.json', 'w') as f:
    json.dump({'histogram': histogram_json, 'line': line_json, 'cohort': cohort_json}, f)
```