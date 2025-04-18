import plotly.express as px
import pandas as pd
import json

# Create sample data
data = {
    'year': [2019, 2020, 2021, 2022],
    'graduation_rate': [85, 87, 88, 89],
    'test_scores': [75, 76, 78, 77],
    'dropout_rate': [5, 4.5, 4, 3.8],
    'student_teacher_ratio': [16, 15.5, 15, 14.8],
    'funding_per_student': [9000, 9200, 9500, 9700]
}
district_data = {
    'district': ['District A', 'District B', 'District C', 'District D'],
    'graduation_rate': [89, 85, 88, 90],
    'test_scores': [77, 75, 80, 78],
    'funding_per_student': [9500, 9200, 9800, 9600]
}

# Create pandas DataFrame
df = pd.DataFrame(data)
df_district = pd.DataFrame(district_data)

# 1. Line chart for trend analysis
fig1 = px.line(df, x='year', y=['graduation_rate', 'test_scores', 'dropout_rate'], markers=True,
               labels={'value': 'Percentage'}, title="Annual Trends in Graduation Rate, Test Scores, and Dropout Rate")

# 2. Bar chart for resource allocation per district
fig2 = px.bar(df_district, x='district', y='funding_per_student', title="Funding per Student by District",
              labels={'funding_per_student': 'Funding per Student ($)'})

# 3. Scatter plot for student-to-teacher ratio and graduation rate
fig3 = px.scatter(df, x='student_teacher_ratio', y='graduation_rate', trendline="ols",
                  labels={'student_teacher_ratio': 'Student-to-Teacher Ratio', 'graduation_rate': 'Graduation Rate (%)'},
                  title="Correlation between Student-to-Teacher Ratio and Graduation Rate")

# Save JSON chart schemas to file
chart_schemas = {
    'line_chart': json.loads(fig1.to_json()),
    'bar_chart': json.loads(fig2.to_json()),
    'scatter_chart': json.loads(fig3.to_json())
}

with open("chart_schemas.json", "w") as file:
    json.dump(chart_schemas, file, indent=4)

print("Chart schemas saved to chart_schemas.json")
