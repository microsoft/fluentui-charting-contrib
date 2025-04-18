import plotly.express as px
import pandas as pd
import json

# Sample data
data = {
    "item ID": ["A1", "A2", "A3", "A4", "A5"],
    "supplier": ["Supplier1", "Supplier2", "Supplier1", "Supplier2", "Supplier3"],
    "stock levels": [100, 150, 80, 200, 90],
    "order fulfillment time": [5, 7, 6, 4, 8],
    "delivery success rate": [95, 98, 97, 93, 99],
}

df = pd.DataFrame(data)

# Visualization 1: Bar chart showing stock levels by supplier
fig1 = px.bar(df, x="supplier", y="stock levels", color="supplier", 
              title="Stock Levels by Supplier", 
              labels={"supplier": "Supplier", "stock levels": "Stock Levels"})

# Visualization 2: Box plot showing order fulfillment times by supplier
fig2 = px.box(df, x="supplier", y="order fulfillment time", 
              title="Order Fulfillment Time by Supplier", 
              labels={"supplier": "Supplier", "order fulfillment time": "Order Fulfillment Time (days)"})

# Visualization 3: Scatter plot showing delivery success rate versus order fulfillment time
fig3 = px.scatter(df, x="order fulfillment time", y="delivery success rate", 
                  color="supplier", 
                  title="Delivery Success Rate vs. Order Fulfillment Time", 
                  labels={"order fulfillment time": "Order Fulfillment Time (days)", "delivery success rate": "Delivery Success Rate (%)"})

# Convert each figure to JSON
fig1_json = fig1.to_json()
fig2_json = fig2.to_json()
fig3_json = fig3.to_json()

# Save the JSON schemas to a file
with open("plotly_json_schemas.json", "w") as f:
    json.dump({"bar_chart": fig1_json, "box_plot": fig2_json, "scatter_plot": fig3_json}, f)
