import plotly.graph_objects as go
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from plotly import io as pio

# Generate random data
np.random.seed(0)

n_rows = 50
data = {
    "ID": [f"ID-{i+1:03d}" for i in range(n_rows)],
    "Date": [datetime(2023, 1, 1) + timedelta(days=np.random.randint(0, 365)) for _ in range(n_rows)],
    "Revenue": np.random.uniform(10000, 50000, n_rows),
    "Units Sold": np.random.randint(50, 500, n_rows),
    "Temperature (°C)": np.random.uniform(-10, 40, n_rows),
    "Category": np.random.choice(["A", "B", "C"], n_rows)
}

# Convert to DataFrame
df = pd.DataFrame(data)

# Format values
df["Date"] = df["Date"].dt.strftime("%b %d, %Y")
df["Revenue"] = df["Revenue"].apply(lambda x: f"${x:,.2f}")
df["Temperature (°C)"] = df["Temperature (°C)"].apply(lambda x: f"{x:.1f}°C")

# Create the Plotly Table
fig = go.Figure(data=[go.Table(
    header=dict(
        values=list(df.columns),
        fill_color='lightblue',
        align='left',
        font=dict(size=12, color='black')
    ),
    cells=dict(
        values=[df[col] for col in df.columns],
        fill_color='white',
        align='left',
        font=dict(size=11),
        height=28
    )
)])

fig.update_layout(
    title="📊 Plotly Table with Currency, Date, Numbers, and Temperature",
    height=1200  # Adjust depending on your rows
)

pio.write_json(fig, "50_rows_table.json")