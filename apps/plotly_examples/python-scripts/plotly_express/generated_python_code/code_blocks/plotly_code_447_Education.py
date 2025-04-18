```python
import plotly.express as px
import pandas as pd
import json

# Sample realistic data
data = {
    "student_id": ["S1", "S2", "S3", "S4", "S5"],
    "grade": ["Grade 10", "Grade 11", "Grade 10", "Grade 12", "Grade 11"],
    "school": ["School A", "School A", "School B", "School B", "School A"],
    "activity_type": ["Sports", "Music", "Art", "Sports", "Music"],
    "engagement_score": [80, 90, 70, 85, 75],
    "attendance_rate": [95, 98, 80, 92, 88]
}

df = pd.DataFrame(data)

# Bar chart showing average engagement score by grade
fig1 = px.bar(df, x="grade", y="engagement_score", color="grade", barmode="group", 
              title="Average Engagement Score by Grade")
fig1_json = fig1.to_json()

# Pie chart showing proportion of students by activity type
fig2 = px.pie(df, names="activity_type", values="engagement_score", 
              title="Proportion of Students by Activity Type")
fig2_json = fig2.to_json()

# Scatter plot showing relationship between engagement score and attendance rate
fig3 = px.scatter(df, x="engagement_score", y="attendance_rate", color="school", 
                  title="Engagement Score vs. Attendance Rate")
fig3_json = fig3.to_json()

# Save JSON schemas to file
with open("plotly_chart_schemas.json", "w") as f:
    json.dump({"bar_chart": fig1_json, "pie_chart": fig2_json, "scatter_plot": fig3_json}, f)
```