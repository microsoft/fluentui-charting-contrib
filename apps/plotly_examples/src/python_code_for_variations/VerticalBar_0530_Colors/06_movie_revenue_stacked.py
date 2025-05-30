# Movie revenue (stacked alphabet)
import pandas as pd
import plotly.express as px

genres = ["Action","Comedy","Drama","Horror","Sci‑Fi"]
domestic = [350,270,310,120,250]
international = [500,330,390,180,300]
df = pd.DataFrame({
"Genre": genres*2,
"Market": ["Domestic"]*5 + ["International"]*5,
"Revenue": domestic + international
})


fig = px.bar(df, x='Genre', y='Revenue', color='Market', title='Movie Revenue: Domestic vs International ($M)')
fig.update_layout(barmode="stack")
fig.update_layout(colorway=px.colors.qualitative.Alphabet)
fig_json = fig.to_json()

# Save to file
with open("06.json", "w") as f:
    f.write(fig_json)
