# Temperature high/low (grouped rainbow-ish)
import pandas as pd
import plotly.express as px

months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
high = [7,9,13,17,21,25,28,27,23,18,12,8]
low  = [-1,0,3,6,10,14,16,16,12,7,2,-1]
df = pd.DataFrame({
"Month": months*2,
"Type": ["High"]*12 + ["Low"]*12,
"Temp": high + low
})


fig = px.bar(df, x='Month', y='Temp', color='Type', title='Monthly High / Low Temperatures (°C)')
fig.update_layout(barmode="group")
fig.update_layout(colorway=px.colors.qualitative.T10)
fig_json = fig.to_json()

# Save to file
with open("04.json", "w") as f:
    f.write(fig_json)
