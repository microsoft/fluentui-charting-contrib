"""
Single figure with four different chart types, all built with Plotly Express:

1️⃣ Pie chart  – Global passenger-vehicle sales by fuel type (2024)  
2️⃣ Vertical bar – Top EV manufacturers by units sold (’000s, 2024)  
3️⃣ Scatter     – Electric-car range (km) vs MSRP (USD k) for popular 2024 models  
4️⃣ Horizontal bar – Battery-EV share of new-car sales in leading countries (2024)

*The numbers are illustrative but directionally consistent with public 2024 reports.*
"""

import pandas as pd
import plotly.express as px
from plotly.subplots import make_subplots
from plotly import io as pio

# --------------------------------------------------------------------
# 1. Data
# --------------------------------------------------------------------
fuel_df = pd.DataFrame({
    "Fuel": ["Gasoline", "Diesel", "Hybrid", "Plug-in Hybrid", "Battery Electric"],
    "Vehicles (M)": [42, 15, 9, 4, 11]
})

maker_df = pd.DataFrame({
    "Maker": ["Tesla", "BYD", "SAIC", "Volkswagen", "Hyundai-Kia"],
    "EVs_sold_k": [1850, 1460, 1030, 820, 610]   # units in thousands
})

models_df = pd.DataFrame({
    "Model": ["Tesla Model 3", "BYD Dolphin", "VW ID.4", "Hyundai Ioniq 5", "Chevy Bolt"],
    "Range_km": [438, 420, 402, 488, 417],
    "MSRP_USD_k": [38, 17, 37, 42, 27]
})

country_df = pd.DataFrame({
    "Country": ["Norway", "Netherlands", "China", "Sweden", "Germany"],
    "EV_share_%": [82, 45, 35, 34, 26]
})

# --------------------------------------------------------------------
# 2. Subplot canvas (2 × 2 grid)
# --------------------------------------------------------------------
fig = make_subplots(
    rows=2, cols=2,
    specs=[[{"type": "domain"}, {"type": "xy"}],
           [{"type": "xy"},     {"type": "xy"}]],
    subplot_titles=[
        "Global Car Sales by Fuel (2024)",
        "Top EV Makers (’000 vehicles, 2024)",
        "EV Range vs MSRP (2024 models)",
        "BEV Market-Share Leaders (2024)"
    ]
)

# --------------------------------------------------------------------
# 3. Build each chart with Plotly Express, then add its single trace
# --------------------------------------------------------------------
# Pie
fig.add_trace(
    px.pie(fuel_df, names="Fuel", values="Vehicles (M)", hole=0.3).data[0],
    row=1, col=1
)

# Vertical bar
fig.add_trace(
    px.bar(maker_df, x="Maker", y="EVs_sold_k").data[0],
    row=1, col=2
)

# Scatter
scatter = px.scatter(
    models_df,
    x="Range_km", y="MSRP_USD_k",
    text="Model"
).update_traces(textposition="top center")
fig.add_trace(scatter.data[0], row=2, col=1)

# Horizontal bar
fig.add_trace(
    px.bar(country_df, x="EV_share_%", y="Country", orientation="h").data[0],
    row=2, col=2
)

# --------------------------------------------------------------------
# 4. Global layout tweaks
# --------------------------------------------------------------------
fig.update_layout(
    title="Electric-Vehicle Landscape — Snapshot 2024",
    height=750,
    showlegend=False,
    margin=dict(l=40, r=40, t=80, b=40)
)

# --------------------------------------------------------------------
# 5. Display (interactive in notebooks / browser)
# --------------------------------------------------------------------
pio.write_json(fig, "composite_multiplot.json")
