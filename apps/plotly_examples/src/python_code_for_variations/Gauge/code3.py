import plotly.graph_objects as go
import numpy as np

# === Parameters ===
current_value = 70  # The value shown by the needle
max_value = 100     # Max value on the gauge
num_sections = 5    # Number of gauge color segments
colors = ['#85e043', '#d4e157', '#ffe082', '#ffb74d', '#ef5350']

# === Function to create each colored section ===
def create_gauge_section(start, end, color):
    theta = np.linspace(start, end, 30)
    r = np.ones_like(theta) * 1
    return go.Scatterpolar(
        r=r,
        theta=theta,
        mode='lines',
        line=dict(color=color, width=20),
        hoverinfo='skip',
        showlegend=False
    )

# === Create sections ===
sections = []
angle_per_section = 180 / num_sections
for i in range(num_sections):
    start_angle = i * angle_per_section
    end_angle = (i + 1) * angle_per_section
    sections.append(create_gauge_section(start_angle, end_angle, colors[i]))

# === Create needle ===
needle_angle = (current_value / max_value) * 180
needle = go.Scatterpolar(
    r=[0, 1],
    theta=[0, needle_angle],
    mode='lines+markers',
    line=dict(color='black', width=4),
    marker=dict(size=8, color='black'),
    hoverinfo='skip',
    showlegend=False
)

# === Layout and figure ===
fig = go.Figure(data=sections + [needle])

fig.update_layout(
    polar=dict(
        angularaxis=dict(
            rotation=90,  # start from top
            direction="clockwise",
            showticklabels=False,
            ticks=''
        ),
        radialaxis=dict(visible=False, range=[0, 1])
    ),
    showlegend=False,
    title="Custom Gauge using Scatterpolar"
)

# === Save to JSON ===
fig.write_json("gauge_scatterpolar.plotly.json")
