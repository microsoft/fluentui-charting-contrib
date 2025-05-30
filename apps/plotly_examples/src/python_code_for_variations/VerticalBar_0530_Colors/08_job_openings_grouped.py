# Job openings (grouped safe palette)
import pandas as pd
import plotly.express as px

industries = ["IT","Healthcare","Finance","Education","Manufacturing"]
remote = [180,90,60,80,70]
onsite = [140,190,90,120,110]
df = pd.DataFrame({
"Industry": industries*2,
"Mode": ["Remote"]*5 + ["On‑site"]*5,
"Openings": remote + onsite
})


fig = px.bar(df, x='Industry', y='Openings', color='Mode', title='Job Openings: Remote vs On‑site')
fig.update_layout(barmode="group")
fig.update_layout(colorway=px.colors.qualitative.Safe)
fig_json = fig.to_json()

# Save to file
with open("08.json", "w") as f:
    f.write(fig_json)
