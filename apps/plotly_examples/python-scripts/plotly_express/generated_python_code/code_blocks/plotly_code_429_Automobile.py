```python
import plotly.express as px
import pandas as pd

data = {
    'Customer Age': [22, 35, 45, 56, 67, 19, 23, 45, 50, 30, 29, 40, 41, 60, 33],
    'Gender': ['Female', 'Male', 'Male', 'Female', 'Female', 'Male', 'Female', 'Male', 'Male', 'Female', 'Female', 'Male', 'Female', 'Male', 'Male'],
    'Income Level': [30000, 55000, 45000, 70000, 60000, 25000, 32000, 49000, 52000, 40000, 39000, 64000, 78000, 61000, 42000],
    'Preferred Vehicle Features': ['Safety', 'Performance', 'Comfort', 'Economy', 'Luxury', 'Economy', 'Safety', 'Performance', 'Comfort', 'Luxury', 'Economy', 'Safety', 'Comfort', 'Luxury', 'Comfort'],
    'Purchase History': ['Sedan', 'SUV', 'Sedan', 'Hatchback', 'SUV', 'Sedan', 'SUV', 'SUV', 'Sedan', 'Hatchback', 'SUV', 'Sedan', 'Sedan', 'SUV', 'Hatchback']
}

df = pd.DataFrame(data)

# Grouping data for better visualization
age_groups = pd.cut(df['Customer Age'], bins=[18, 25, 35, 45, 55, 65, 75], labels=['18-25', '26-35', '36-45', '46-55', '56-65', '66-75'])
df['Age Group'] = age_groups

# Bar Chart: Age Group vs Preferred Vehicle Features
fig1 = px.bar(df.groupby(["Age Group", "Preferred Vehicle Features"]).size().reset_index(name='Count'), 
              x='Age Group', y='Count', color='Preferred Vehicle Features', title='Preferred Vehicle Features by Age Group')
json_schema1 = fig1.to_json()
with open('chart1.json', 'w') as f1:
    f1.write(json_schema1)

# Pie Chart: Gender Distribution
fig2 = px.pie(df, names='Gender', title='Gender Distribution')
json_schema2 = fig2.to_json()
with open('chart2.json', 'w') as f2:
    f2.write(json_schema2)

# Scatter Plot: Customer Age vs Income Level colored by Purchase History
fig3 = px.scatter(df, x='Customer Age', y='Income Level', color='Purchase History', title='Customer Age vs Income Level by Purchase History')
json_schema3 = fig3.to_json()
with open('chart3.json', 'w') as f3:
    f3.write(json_schema3)
```