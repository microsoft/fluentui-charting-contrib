import pandas as pd
import plotly.graph_objects as go

df = pd.DataFrame({
    'source': ['A', 'A', 'B', 'C', 'D'],
    'target': ['C', 'D', 'D', 'E', 'E'],
    'value': [8, 2, 4, 8, 4]
})

# Map labels to indices
labels = list(pd.unique(df[['source', 'target']].values.ravel('K')))
label_index = {label: i for i, label in enumerate(labels)}

df['source_idx'] = df['source'].map(label_index)
df['target_idx'] = df['target'].map(label_index)

fig = go.Figure(data=[go.Sankey(
    arrangement='snap',
    node=dict(
        label=["Input", "Process", "Output"],
        color=["#636EFA", "#EF553B", "#00CC96"],
        pad=20
    ),
    link=dict(
        source=[0, 1],
        target=[1, 2],
        value=[10, 10],
        color=["rgba(99,110,250,0.4)", "rgba(239,85,59,0.4)"]
    )
)])

# Save to plotly JSON
with open("sankey_custom.json", "w") as f:
    f.write(fig.to_json())

