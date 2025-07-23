import plotly.express as px

data = {'Category': ['A', 'B', 'C', 'D'],
        'Values': [40, 30, 20, 10]}

fig = px.pie(data, names='Category', values='Values', hole=0.4)
fig.show()

# Save to plotly.json
fig.write_json("donut_basic.json")
