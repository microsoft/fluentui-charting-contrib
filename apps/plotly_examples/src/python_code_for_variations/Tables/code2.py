import plotly.graph_objects as go

# Long text data
headers = ["ID", "Description", "Notes"]
data = [
    [1, 2, 3],
    [
        "This is a very long description of the first item that might span multiple lines.",
        "Another long description, even longer than the first, to demonstrate text overflow handling.",
        "Short description."
    ],
    [
        "First note with a detailed explanation and a couple of extra sentences just to make it long.",
        "Second note with technical jargon and verbose commentary to increase the content length.",
        "Concise note."
    ]
]

# Insert <br> to manually control wrapping (optional)
def wrap_text(text, width=40):
    import textwrap
    return "<br>".join(textwrap.wrap(text, width=width))

wrapped_data = [[wrap_text(cell) if isinstance(cell, str) else cell for cell in column] for column in data]

# Create the table
fig = go.Figure(data=[go.Table(
    columnwidth=[50, 400, 400],  # Adjust column widths
    header=dict(values=headers,
                fill_color='lightgrey',
                align='left'),
    cells=dict(values=wrapped_data,
               fill_color='white',
               align='left'))
])

# Export to JSON
fig_json = fig.to_json()

# Save to file
with open("table_large_data_cells.json", "w") as f:
    f.write(fig_json)

# Optional: print preview of JSON (first 300 characters)
print(fig_json[:300])
