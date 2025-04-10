import pandas as pd
import plotly.express as px
import numpy as np
import json

angles = np.linspace(0, 180, 181)
values = np.array([70 if a <= 126 else 0 for a in angles])  # 126 degrees = 70% of 180

df = pd.DataFrame({"theta": angles, "r": values})

fig = px.line_polar(df, r="r", theta="theta", line_close=False)
fig.update_traces(line_color="royalblue", fill='toself')
fig.update_layout(polar=dict(radialaxis=dict(range=[0, 100], showticklabels=False), angularaxis=dict(rotation=90)))

# Save as JSON
with open("semi_gauge_polar.json", "w") as f:
    json.dump(fig.to_plotly_json(), f)
