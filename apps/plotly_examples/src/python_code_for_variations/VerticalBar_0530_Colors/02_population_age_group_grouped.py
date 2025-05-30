# Population age group (grouped pastel)
import pandas as pd
import plotly.express as px

data = {
"Age Group": ["0‑14","15‑24","25‑54","55‑64","65+"]*2,
"Gender": ["Male"]*5 + ["Female"]*5,
"Population": [1.0,0.6,2.2,0.5,0.4,0.9,0.6,2.3,0.6,0.5]
}
df = pd.DataFrame(data)


fig = px.bar(df, x='Age Group', y='Population', color='Gender', title='Population by Age & Gender')
fig.update_layout(barmode="group")
fig.update_layout(colorway=px.colors.qualitative.Pastel)
fig_json = fig.to_json()

# Save to file
with open("02.json", "w") as f:
    f.write(fig_json)
