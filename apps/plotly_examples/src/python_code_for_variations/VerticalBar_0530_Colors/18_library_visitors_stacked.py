# Library visitors (stacked custom)
import pandas as pd
import plotly.express as px

days = ["Mon","Tue","Wed","Thu","Fri","Sat"]
adults = [90,80,85,95,110,120]
children = [60,50,55,65,70,80]
df = pd.DataFrame({
"Day": days*2,
"Group": ["Adults"]*6 + ["Children"]*6,
"Visitors": adults + children
})


fig = px.bar(df, x='Day', y='Visitors', color='Group', title='Library Visitors: Adults vs Children')
fig.update_layout(barmode="stack")
fig.update_layout(colorway=['#8E44AD','#F1C40F'])
fig_json = fig.to_json()

# Save to file
with open("18.json", "w") as f:
    f.write(fig_json)
