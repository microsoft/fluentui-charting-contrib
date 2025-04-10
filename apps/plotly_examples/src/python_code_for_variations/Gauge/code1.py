import plotly.graph_objects as go

fig = go.Figure(go.Indicator(
    mode="gauge+number+delta",
    value=70,
    delta={'reference': 90},
    gauge={
        'axis': {'range': [0, 100]},
        'bar': {'color': "darkblue"},
        'steps': [
            {'range': [0, 50], 'color': "lightgray"},
            {'range': [50, 100], 'color': "gray"}],
        'threshold': {
            'line': {'color': "red", 'width': 4},
            'thickness': 0.75,
            'value': 90}},
))

# Export as plotly.json
import json
with open("gauge_chart.json", "w") as f:
    json.dump(fig.to_plotly_json(), f)
