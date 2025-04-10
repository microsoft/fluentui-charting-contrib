import pandas as pd
import plotly.express as px

df = pd.DataFrame({
    'Labels': ['Apples', 'Bananas', 'Cherries', 'Dates'],
    'Amount': [15, 30, 45, 10]
})

fig = px.pie(
    df,
    names='Labels',
    values='Amount',
    hole=0.3,
    color_discrete_sequence=px.colors.sequential.RdBu,
    title='Fruit Distribution'
)

fig.update_traces(textposition='inside', textinfo='percent+label')
fig.show()

fig.write_json("donut_customized.json")

