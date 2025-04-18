import plotly.express as px
import pandas as pd
import json

# Generate realistic data
data = {
    "Grade": ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"] * 3,
    "Subject": ["Math", "Science", "Literature"] * 5,
    "Curriculum_Type": ["Traditional", "Interactive", "Experimental"] * 5,
    "Avg_Test_Score": [75, 78, 80, 82, 85, 68, 72, 74, 76, 78, 88, 90, 92, 94, 96],
    "Teacher_Qualification_Level": ["Bachelor", "Master", "PhD"] * 5,
    "Feedback_Rating": [4.5, 4.6, 4.8, 4.9, 5.0, 4.2, 4.3, 4.5, 4.7, 4.8, 4.8, 4.9, 4.9, 5.0, 5.0]
}

df = pd.DataFrame(data)

# Visualization 1: Bar Chart showing average test scores by curriculum type and grade
fig1 = px.bar(df, x="Grade", y="Avg_Test_Score", color="Curriculum_Type", barmode="group", title="Average Test Scores by Curriculum Type and Grade")
fig1_json = fig1.to_json()

# Visualization 2: Scatter Plot showing feedback rating vs average test scores
fig2 = px.scatter(df, x="Feedback_Rating", y="Avg_Test_Score", color="Curriculum_Type", title="Feedback Rating vs Average Test Scores by Curriculum Type")
fig2_json = fig2.to_json()

# Visualization 3: Line Chart showing average test scores progression across grades for each curriculum type
fig3 = px.line(df, x="Grade", y="Avg_Test_Score", color="Curriculum_Type", title="Average Test Scores Progression Across Grades")
fig3_json = fig3.to_json()

# Save the JSON schemas to a file
with open('plotly_schemas.json', 'w') as f:
    json.dump({"bar_chart": fig1_json, "scatter_plot": fig2_json, "line_chart": fig3_json}, f)
