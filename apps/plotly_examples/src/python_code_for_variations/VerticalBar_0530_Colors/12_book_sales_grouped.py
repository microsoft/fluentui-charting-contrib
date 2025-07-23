# Book sales (grouped set2)
import pandas as pd
import plotly.express as px

formats = ["Hardcover","Paperback","E‑book","Audiobook"]
sales_2024 = [85,130,160,70]
sales_2025 = [90,140,180,75]
df = pd.DataFrame({
"Format": formats*2,
"Year": ["2024"]*4 + ["2025"]*4,
"Sales": sales_2024 + sales_2025
})


fig = px.bar(df, x='Format', y='Sales', color='Year', title='Book Sales by Format (2024 vs 2025)')
fig.update_layout(barmode="group")
fig.update_layout(colorway=px.colors.qualitative.Set2)
fig_json = fig.to_json()

# Save to file
with open("12.json", "w") as f:
    f.write(fig_json)
