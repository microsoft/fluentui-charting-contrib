import plotly.express as px
import pandas as pd

# Generate realistic data
data = {
    'Month': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October'],
    'Feedback_Score': [7.8, 8.2, 7.5, 8.0, 8.1, 7.9, 8.3, 8.4, 8.6, 8.5],
    'Frequency_of_Interactions': [25, 27, 30, 28, 26, 30, 29, 31, 32, 33],
    'Query_Type': ['Complaint', 'Query', 'Complaint', 'Query', 'Complaint', 'Query', 'Query', 'Complaint', 'Query', 'Query'],
    'Resolution_Time_Days': [5.1, 4.5, 5.8, 4.6, 5.2, 4.8, 5.5, 4.7, 5.3, 4.9]
}
df = pd.DataFrame(data)

# Create visualizations
fig1 = px.line(df, x='Month', y='Feedback_Score', title="Monthly Client Feedback Scores")
fig2 = px.bar(df, x='Month', y='Frequency_of_Interactions', title="Monthly Frequency of Client Interactions")
fig3 = px.scatter(df, x='Month', y='Resolution_Time_Days', color='Query_Type', title="Resolution Times by Query Type")

# Generate JSON schemas
charts = {
    'Feedback_Score_Line_Chart': fig1.to_json(),
    'Frequency_of_Interactions_Bar_Chart': fig2.to_json(),
    'Resolution_Time_Scatter_Chart': fig3.to_json()
}

# Save JSON schemas to file
with open('client_engagement_dashboard_chart_schemas.json', 'w') as file:
    file.write(str(charts))
