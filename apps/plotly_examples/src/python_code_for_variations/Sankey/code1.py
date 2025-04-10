import plotly.graph_objects as go
import json

fig = go.Figure(data=[go.Sankey(
    node=dict(
        pad=15,
        thickness=20,
        line=dict(color="black", width=0.5),
        label=["A", "B", "C", "D", "E"],
        color=["blue", "blue", "blue", "green", "green"]
    ),
    link=dict(
        source=[0, 1, 0, 2, 3],
        target=[2, 3, 3, 4, 4],
        value=[8, 4, 2, 8, 4]
    )
)])

# Show plot
fig.show()

# Export to JSON
with open("sankey_chart.json", "w") as f:
    f.write(fig.to_json())
