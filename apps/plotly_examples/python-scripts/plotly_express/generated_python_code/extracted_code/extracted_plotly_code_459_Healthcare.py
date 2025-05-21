import plotly.express as px
import pandas as pd

# Sample Data
data = {
    'Region': ['North', 'South', 'East', 'West'],
    'Telemedicine_Consultations': [1200, 1500, 1800, 1000],
    'Follow_Up_Rate': [0.45, 0.50, 0.55, 0.40],
    'Age_Group': ['18-25', '25-40', '40-60', '60+'],
    'Gender': ['Male', 'Female', 'Male', 'Female']
}

df = pd.DataFrame(data)

# Bar Chart: Telemedicine Consultations by Region
fig1 = px.bar(df, x='Region', y='Telemedicine_Consultations', title="Telemedicine Consultations by Region")
json_fig1 = fig1.to_json()

# Scatter Plot: Follow-up Rate vs Telemedicine Consultations
fig2 = px.scatter(df, x='Telemedicine_Consultations', y='Follow_Up_Rate', color='Region', title="Follow-up Rate vs Telemedicine Consultations")
json_fig2 = fig2.to_json()

# Pie Chart: Telemedicine Consultations Distribution by Age and Gender
df_grouped = df.groupby(['Age_Group', 'Gender']).sum().reset_index()
fig3 = px.pie(df_grouped, values='Telemedicine_Consultations', names='Age_Group', title="Telemedicine Consultations Distribution by Age and Gender", color='Gender')
json_fig3 = fig3.to_json()

# Save JSON Schemas to file
with open('chart_schemas.json', 'w') as f:
    f.write(json_fig1 + '\n')
    f.write(json_fig2 + '\n')
    f.write(json_fig3 + '\n')
