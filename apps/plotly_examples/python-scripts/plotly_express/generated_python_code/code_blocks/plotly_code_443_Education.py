```python
import plotly.express as px
import pandas as pd
import json

# Sample realistic data
data = {
    "year": [2018, 2019, 2020, 2021, 2022, 2018, 2019, 2020, 2021, 2022],
    "institution_type": ["Public", "Public", "Public", "Public", "Public", "Private", "Private", "Private", "Private", "Private"],
    "region": ["North", "North", "North", "North", "North", "South", "South", "South", "South", "South"],
    "enrollment": [5000, 5200, 5100, 5300, 5400, 3000, 3100, 2950, 3200, 3300]
}

df = pd.DataFrame(data)

# Create line chart: Enrollment trends over the years
fig1 = px.line(df, x="year", y="enrollment", color="institution_type", title="Enrollment Trends Over Years")
line_chart_json = fig1.to_json()

# Create bar chart: Enrollment by region
fig2 = px.bar(df, x="region", y="enrollment", color="institution_type", title="Enrollment by Region and Institution Type")
bar_chart_json = fig2.to_json()

# Create scatter plot: Enrollment patterns by region and year
fig3 = px.scatter(df, x="year", y="enrollment", color="region", symbol="institution_type", title="Enrollment Patterns")
scatter_chart_json = fig3.to_json()

# Save JSON schemas to a file
charts_json = {
    "line_chart": line_chart_json,
    "bar_chart": bar_chart_json,
    "scatter_chart": scatter_chart_json
}

with open('education_enrollment_charts.json', 'w') as f:
    json.dump(charts_json, f)
```