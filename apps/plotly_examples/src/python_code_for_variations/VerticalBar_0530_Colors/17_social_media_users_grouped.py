# Social media users (grouped set3)
import pandas as pd
import plotly.express as px

platforms = ["P‑A","P‑B","P‑C","P‑D"]
users_24 = [250,300,180,90]
users_25 = [270,320,200,105]
df = pd.DataFrame({
"Platform": platforms*2,
"Year": ["2024"]*4 + ["2025"]*4,
"Users_M": users_24 + users_25
})


fig = px.bar(df, x='Platform', y='Users_M', color='Year', title='Social‑Media Active Users (M)')
fig.update_layout(barmode="group")
fig.update_layout(colorway=px.colors.qualitative.Set3)
fig_json = fig.to_json()

# Save to file
with open("17.json", "w") as f:
    f.write(fig_json)
