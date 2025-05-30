# Energy consumption (grouped G10)
import pandas as pd
import plotly.express as px

sources = ["Coal","Nat Gas","Solar","Wind","Hydro"]
y23 = [400,350,200,180,220]
y24 = [380,340,230,200,210]
df = pd.DataFrame({
"Source": sources*2,
"Year": ["2023"]*5 + ["2024"]*5,
"TWh": y23 + y24
})


fig = px.bar(df, x='Source', y='TWh', color='Year', title='Energy Consumption by Source 2023 vs 2024')
fig.update_layout(barmode="group")
fig.update_layout(colorway=px.colors.qualitative.G10)
fig_json = fig.to_json()

# Save to file
with open("15.json", "w") as f:
    f.write(fig_json)
