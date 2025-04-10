import plotly.express as px
import pandas as pd

df = px.data.gapminder().query("continent == 'Asia' and year >= 2000")
fig = px.area(df, x="year", y="pop", color="country", 
              color_discrete_sequence=px.colors.qualitative.Pastel, 
              title="Custom Color Area Chart")

fig.update_traces(opacity=0.7)

with open("area_custom_colors.json", "w") as f:
    f.write(fig.to_json())
