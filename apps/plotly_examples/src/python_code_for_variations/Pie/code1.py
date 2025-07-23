import plotly.express as px
import plotly.io as pio

data = {
    "Category": ["A", "B", "C", "D"],
    "Values": [10, 20, 30, 40]
}

fig = px.pie(data, names="Category", values="Values", title="Basic Pie Chart")

# Export to plotly.json
pio.write_json(fig, "basic_pie_chart.json")
