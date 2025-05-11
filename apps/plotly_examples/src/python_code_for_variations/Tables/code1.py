import plotly.graph_objects as go
import json

# Create the table
products = ["Apples", "Bananas", "Oranges"]
quantities = [10, 20, 15]
prices = [1.0, 0.5, 0.75]
totals = [q * p for q, p in zip(quantities, prices)]

fig = go.Figure(data=[go.Table(
    header=dict(values=["Product", "Quantity", "Price", "Total"]),
    cells=dict(values=[products + ["Total"],
                       quantities + [sum(quantities)],
                       prices + [""],
                       totals + [sum(totals)]])
)])

# Export to JSON
fig_json = fig.to_json()

# Save to file
with open("table_total_rows.json", "w") as f:
    f.write(fig_json)

# Optional: print preview of JSON (first 300 characters)
print(fig_json[:300])
