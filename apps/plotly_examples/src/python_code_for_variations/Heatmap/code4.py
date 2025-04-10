import plotly.express as px
import pandas as pd

df = px.data.tips()

df_cat = pd.DataFrame({
    'actual': ['cat', 'dog', 'cat', 'dog', 'dog', 'cat'],
    'predicted': ['dog', 'dog', 'cat', 'cat', 'dog', 'cat'],
})

fig = px.density_heatmap(df_cat, x="predicted", y="actual", color_continuous_scale="reds")

with open("heatmap_categorical.json", "w") as f:
    f.write(fig.to_json())

