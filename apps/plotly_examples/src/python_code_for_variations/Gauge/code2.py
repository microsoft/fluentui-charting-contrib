import plotly.express as px
import pandas as pd
import numpy as np
import json

value = 70  # gauge value
df = pd.DataFrame({
    "theta": ["Used", "Unused"],
    "r": [value, 100 - value]
})

fig = px.pie(df, names="theta", values="r", hole=0.6)
fig.update_traces(textinfo='none', marker=dict(colors=["royalblue", "lightgray"]))
# fig.update_layout(showlegend=False)

# Save as JSON
with open("fake_gauge_pie.json", "w") as f:
    json.dump(fig.to_plotly_json(), f)
