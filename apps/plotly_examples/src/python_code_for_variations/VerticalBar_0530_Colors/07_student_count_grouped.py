# Student count (grouped tropic)
import pandas as pd
import plotly.express as px

grades = ["1st","2nd","3rd","4th","5th"]
male = [24,22,23,24,25]
female = [26,23,25,28,24]
df = pd.DataFrame({
"Grade": grades*2,
"Gender": ["Male"]*5 + ["Female"]*5,
"Students": male + female
})


fig = px.bar(df, x='Grade', y='Students', color='Gender', title='Students per Grade & Gender')
fig.update_layout(barmode="group")
fig.update_layout(colorway=px.colors.diverging.Tropic)
fig_json = fig.to_json()

# Save to file
with open("07.json", "w") as f:
    f.write(fig_json)
