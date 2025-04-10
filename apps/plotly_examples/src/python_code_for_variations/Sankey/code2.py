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
    node=dict(label=labels),
    link=dict(
        source=df['source_idx'],
        target=df['target_idx'],
        value=df['value']
    )
)])

fig.show()

# Save to JSON
with open("sankey_from_df.json", "w") as f:
    f.write(fig.to_json())
