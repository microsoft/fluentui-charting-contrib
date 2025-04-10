import plotly.express as px
import pandas as pd

df = px.data.gapminder().query("continent == 'Asia' and year >= 2000")
df_grouped = df.groupby(["year", "country"], as_index=False)["pop"].sum()
df_total = df_grouped.groupby("year")["pop"].transform("sum")
df_grouped["pop_pct"] = df_grouped["pop"] / df_total

fig = px.area(df_grouped, x="year", y="pop_pct", color="country", 
              title="Proportional Area Chart (Normalized)")

with open("area_normalized.json", "w") as f:
    f.write(fig.to_json())

