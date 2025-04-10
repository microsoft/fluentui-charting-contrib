import pandas as pd
import plotly.express as px

df = pd.DataFrame({
    'Labels': ['Apples', 'Bananas', 'Cherries', 'Dates'],
    'Amount': [15, 30, 45, 10]
})

fig = px.pie(df, names='Labels', values='Amount', hole=0.5)
fig.show()

fig.write_json("donut_dataframe.json")
