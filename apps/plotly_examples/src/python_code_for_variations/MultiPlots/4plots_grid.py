import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from plotly import io as pio

# Sample dataset
df = px.data.iris()

# Create subplots layout: 2 rows, 2 columns
fig = make_subplots(
    rows=2, cols=2,
    subplot_titles=("Scatter", "Histogram", "Box Plot", "Line Chart")
)

# Plot 1: Scatter
scatter = px.scatter(df, x="sepal_width", y="sepal_length", color="species")
for trace in scatter.data:
    fig.add_trace(trace, row=1, col=1)

# Plot 2: Histogram
hist = px.histogram(df, x="petal_length", color="species")
for trace in hist.data:
    fig.add_trace(trace, row=1, col=2)

# Plot 3: Box Plot
box = px.box(df, x="species", y="petal_width", color="species")
for trace in box.data:
    fig.add_trace(trace, row=2, col=1)

# Plot 4: Line Chart
df_sorted = df.sort_values(by="sepal_length")
line = px.line(df_sorted, x="sepal_length", y="sepal_width", color="species")
for trace in line.data:
    fig.add_trace(trace, row=2, col=2)

# Final layout
fig.update_layout(
    height=800,
    width=1000,
    title_text="2x2 Grid of Plots using Plotly Express",
    showlegend=False
)

pio.write_json(fig, "4_plots_grid.json")