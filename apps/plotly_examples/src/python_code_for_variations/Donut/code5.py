import pandas as pd
import plotly.express as px

# Example: Grouped data before plotting
df = pd.DataFrame({
    'Region': ['North', 'South', 'East', 'West', 'North', 'South'],
    'Sales': [100, 200, 150, 170, 130, 160]
})

fig = px.pie(
    df,
    names='Labels',
    values='Amount',
    hole=0.4,
    hover_data=['Amount']
)

fig.update_traces(textinfo='label+percent')
fig.show()

fig.write_json("donut_hover.json")



