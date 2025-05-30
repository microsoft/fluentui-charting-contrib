# Vaccination rates (stacked duo)
import pandas as pd
import plotly.express as px

countries = ["A","B","C","D","E"]
dose1 = [80,72,87,60,95]
dose2 = [75,68,82,55,90]
df = pd.DataFrame({
"Country": countries*2,
"Dose": ["Dose 1"]*5 + ["Dose 2"]*5,
"Rate": dose1 + dose2
})


fig = px.bar(df, x='Country', y='Rate', color='Dose', title='Vaccination Coverage by Dose (%)')
fig.update_layout(barmode="stack")
fig.update_layout(colorway=['#1F77B4','#FF7F0E'])
fig_json = fig.to_json()

# Save to file
with open("14.json", "w") as f:
    f.write(fig_json)
