# Daily steps (grouped spotify brand)
import pandas as pd
import plotly.express as px

employees = [f'E{i}' for i in range(1,11)]
actual = [8000,12000,9000,7000,11000,10000,13000,9500,10500,11500]
goal = [10000]*10
df = pd.DataFrame({
"Employee": employees*2,
"Type": ["Actual"]*10 + ["Goal"]*10,
"Steps": actual + goal
})


fig = px.bar(df, x='Employee', y='Steps', color='Type', title='Daily Steps: Actual vs Goal')
fig.update_layout(barmode="group")
fig.update_layout(colorway=['#1DB954','#B3B3B3'])
fig_json = fig.to_json()

# Save to file
with open("11.json", "w") as f:
    f.write(fig_json)
