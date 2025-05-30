# Company expenses (stacked prism)
import pandas as pd
import plotly.express as px

depts = ["R&D","Marketing","Sales","HR","Ops"]
q1 = [100,70,80,35,120]
q2 = [110,75,90,30,130]
q3 = [90,80,95,45,120]
q4 = [100,75,85,40,130]
df = pd.concat([
pd.DataFrame({"Department": depts, "Quarter":"Q1", "Expense": q1}),
pd.DataFrame({"Department": depts, "Quarter":"Q2", "Expense": q2}),
pd.DataFrame({"Department": depts, "Quarter":"Q3", "Expense": q3}),
pd.DataFrame({"Department": depts, "Quarter":"Q4", "Expense": q4}),
])


fig = px.bar(df, x='Department', y='Expense', color='Quarter', title='Department Expenses by Quarter ($k)')
fig.update_layout(barmode="stack")
fig.update_layout(colorway=px.colors.qualitative.Prism)
fig_json = fig.to_json()

# Save to file
with open("10.json", "w") as f:
    f.write(fig_json)

