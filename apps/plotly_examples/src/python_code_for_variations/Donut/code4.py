import pandas as pd
import plotly.express as px

# Example: Grouped data before plotting
df = pd.DataFrame({
    'Region': ['North', 'South', 'East', 'West', 'North', 'South'],
    'Sales': [100, 200, 150, 170, 130, 160]
})

grouped_df = df.groupby('Region').sum().reset_index()

fig = px.pie(grouped_df, names='Region', values='Sales', hole=0.4)
fig.show()

fig.write_json("donut_grouped.json")


