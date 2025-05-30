# CO2 emissions (grouped bold)
import pandas as pd
import plotly.express as px

sectors = ["Transport","Industry","Residential","Agriculture","Electricity"]
emissions_23 = [120,200,90,60,250]
emissions_24 = [115,210,85,62,240]
df = pd.DataFrame({
"Sector": sectors*2,
"Year": ["2023"]*5 + ["2024"]*5,
"CO2": emissions_23 + emissions_24
})


fig = px.bar(df, x='Sector', y='CO2', color='Year', title='CO₂ Emissions 2023 vs 2024')
fig.update_layout(barmode="group")
fig.update_layout(colorway=px.colors.qualitative.Bold)
fig_json = fig.to_json()

# Save to file
with open("05.json", "w") as f:
    f.write(fig_json)
