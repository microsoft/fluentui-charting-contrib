# Product defects (stacked custom)
import pandas as pd
import plotly.express as px

types = ["Type A","Type B","Type C","Type D"]
minor = [20,30,15,25]
major = [10,15,5,10]
df = pd.DataFrame({
"Defect": types*2,
"Severity": ["Minor"]*4 + ["Major"]*4,
"Count": minor + major
})


fig = px.bar(df, x='Defect', y='Count', color='Severity', title='Product Defects by Severity')
fig.update_layout(barmode="stack")
fig.update_layout(colorway=['#2ECC71','#E74C3C'])
fig_json = fig.to_json()

# Save to file
with open("19.json", "w") as f:
    f.write(fig_json)
