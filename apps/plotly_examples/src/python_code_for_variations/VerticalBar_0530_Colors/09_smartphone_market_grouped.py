# Smartphone market share (grouped dark24)
import pandas as pd
import plotly.express as px

brands = ["A","B","C"]
na = [35,25,15]
eu = [28,32,20]
asia = [25,30,28]
df = pd.DataFrame({
"Brand": brands*3,
"Region": ["NA"]*3 + ["EU"]*3 + ["Asia"]*3,
"Share": na + eu + asia
})


fig = px.bar(df, x='Brand', y='Share', color='Region', title='Smartphone Market Share by Region (%)')
fig.update_layout(barmode="group")
fig.update_layout(colorway=px.colors.qualitative.Dark24)
fig_json = fig.to_json()

# Save to file
with open("09.json", "w") as f:
    f.write(fig_json)
