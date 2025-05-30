# EV registrations (stacked dark24)
import pandas as pd
import plotly.express as px

years = [2019,2020,2021,2022,2023]
na = [8000,12000,18000,24000,30000]
eu = [9000,14000,20000,26000,32000]
asia = [11000,19000,22000,30000,33000]
df = pd.concat([
pd.DataFrame({"Year": years, "Region":"NA", "EVs": na}),
pd.DataFrame({"Year": years, "Region":"EU", "EVs": eu}),
pd.DataFrame({"Year": years, "Region":"Asia", "EVs": asia}),
])


fig = px.bar(df, x='Year', y='EVs', color='Region', title='EV Registrations by Region (stacked)')
fig.update_layout(barmode="stack")
fig.update_layout(colorway=px.colors.qualitative.Dark24)
fig_json = fig.to_json()

# Save to file
with open("13.json", "w") as f:
    f.write(fig_json)
