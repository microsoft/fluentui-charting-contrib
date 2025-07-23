# Website traffic (stacked thematic)
import pandas as pd
import plotly.express as px

data = {
"Day": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]*2,
"Device": ["Desktop"]*7 + ["Mobile"]*7,
"Visitors": [1300,1100,1400,1350,1500,1600,1450,1000,1000,1100,1050,1300,1400,1150]
}
df = pd.DataFrame(data)


fig = px.bar(df, x='Day', y='Visitors', color='Device', title='Website Traffic by Device')
fig.update_layout(barmode="stack")
fig.update_layout(colorway=px.colors.qualitative.Dark2)
fig_json = fig.to_json()

# Save to file
with open("03.json", "w") as f:
    f.write(fig_json)
