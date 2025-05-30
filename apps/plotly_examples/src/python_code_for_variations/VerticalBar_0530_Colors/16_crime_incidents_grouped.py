# Crime incidents (grouped pastel1)
import pandas as pd
import plotly.express as px

areas = [f'Area {i}' for i in range(1,7)]
violent = [40,25,15,30,35,20]
property = [80,55,45,60,75,50]
df = pd.DataFrame({
"Neighborhood": areas*2,
"Crime": ["Violent"]*6 + ["Property"]*6,
"Incidents": violent + property
})


fig = px.bar(df, x='Neighborhood', y='Incidents', color='Crime', title='Crime Incidents by Type')
fig.update_layout(barmode="group")
fig.update_layout(colorway=px.colors.qualitative.Pastel1)
fig_json = fig.to_json()

# Save to file
with open("16.json", "w") as f:
    f.write(fig_json)
