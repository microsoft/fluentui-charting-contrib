import plotly.express as px
import numpy as np
import json

data = np.random.rand(10, 10)

fig = px.imshow(data, color_continuous_scale='Viridis')

# Export to JSON
with open("heatmap_imshow.json", "w") as f:
    f.write(fig.to_json())
