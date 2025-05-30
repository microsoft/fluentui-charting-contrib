# Water usage (grouped prism)
import pandas as pd
import plotly.express as px

appliances = ["Shower","Washer","Dishwasher","Toilet","Faucet"]
actual = [60,50,40,70,30]
benchmark = [50,45,35,60,25]
df = pd.DataFrame({
"Appliance": appliances*2,
"Type": ["Actual"]*5 + ["Benchmark"]*5,
"Liters": actual + benchmark
})


fig = px.bar(df, x='Appliance', y='Liters', color='Type', title='Water Usage: Actual vs Benchmark (L/Day)')
fig.update_layout(barmode="group")
fig.update_layout(colorway=px.colors.qualitative.Prism)
fig_json = fig.to_json()

# Save to file
with open("20.json", "w") as f:
    f.write(fig_json)
