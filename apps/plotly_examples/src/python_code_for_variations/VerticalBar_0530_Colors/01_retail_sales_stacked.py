# Retail sales (stacked vibrant)
import pandas as pd
import plotly.express as px

data = {
"Month": ["Jan","Feb","Mar","Apr","May","Jun"]*2,
"Channel": ["Online"]*6 + ["In‑Store"]*6,
"Sales":  [60,75,85,80,90,110,60,75,85,80,90,90]
}
df = pd.DataFrame(data)


fig = px.bar(df, x='Month', y='Sales', color='Channel', title='Retail Sales: Online vs In‑Store')
fig.update_layout(barmode="stack")
fig.update_layout(colorway=px.colors.qualitative.Vivid)
fig_json = fig.to_json()

# Save to file
with open("01_retail_sales_stacked.json", "w") as f:
    f.write(fig_json)
