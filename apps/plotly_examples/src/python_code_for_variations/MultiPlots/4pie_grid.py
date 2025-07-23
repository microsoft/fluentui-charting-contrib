"""
Four-in-one pie chart: Electricity-generation energy mix (2024)
for the United States, China, India and Germany.
"""

import pandas as pd
import plotly.express as px
from plotly.subplots import make_subplots
from plotly import io as pio

# ------------------------------------------------------------------
# 1. Example data (TWh of electricity generated in 2024, fictional
#    but proportionally realistic).
# ------------------------------------------------------------------
data = {
    "Country": [
        "United States", "United States", "United States", "United States",
        "China",          "China",          "China",          "China",
        "India",          "India",          "India",          "India",
        "Germany",        "Germany",        "Germany",        "Germany",
    ],
    "Source": [
        "Coal", "Natural Gas", "Nuclear", "Renewables",
        "Coal", "Natural Gas", "Nuclear", "Renewables",
        "Coal", "Natural Gas", "Nuclear", "Renewables",
        "Coal", "Natural Gas", "Nuclear", "Renewables",
    ],
    "TWh": [
        800, 1600, 770, 1000,     # USA
        4600,  300, 450, 1250,    # China
        1050, 230,  40,  460,     # India
        120,  90,  65,  250       # Germany
    ]
}

df = pd.DataFrame(data)

# ------------------------------------------------------------------
# 2. Create an empty 2 × 2 subplot grid that accepts “domain” traces
#    (required for pies/donuts in Plotly).
# ------------------------------------------------------------------
fig = make_subplots(
    rows=2,
    cols=2,
    specs=[[{"type": "domain"}, {"type": "domain"}],
           [{"type": "domain"}, {"type": "domain"}]],
    subplot_titles=["United States", "China", "India", "Germany"]
)

# ------------------------------------------------------------------
# 3. Loop over each country, build a px.pie figure, and plug the
#    single trace that px.pie creates into the corresponding slot.
# ------------------------------------------------------------------
countries = ["United States", "China", "India", "Germany"]
for idx, country in enumerate(countries, start=1):
    row = (idx - 1) // 2 + 1     # 1 or 2
    col = (idx - 1) % 2 + 1      # 1 or 2
    
    pie = px.pie(
        df[df["Country"] == country],
        names="Source",
        values="TWh",
        hole=0.3,                     # donut-style; set to 0 for full pie
    )
    
    # px.pie returns a figure with one trace → grab that trace:
    fig.add_trace(pie.data[0], row=row, col=col)

# ------------------------------------------------------------------
# 4. Global layout tweaks.
# ------------------------------------------------------------------
fig.update_layout(
    title_text="Electricity Generation Energy Mix, 2024",
    legend_title_text="Energy Source",
    legend_traceorder="reversed",
    margin=dict(t=80, l=20, r=20, b=20)
)

# ------------------------------------------------------------------
# 5. Show it (creates an interactive figure in notebooks or
#    opens a browser window when run as a script).
# ------------------------------------------------------------------
pio.write_json(fig, "4_pie_grid.json")
