import plotly.express as px
import pandas as pd
import json
from plotly.utils import PlotlyJSONEncoder  # Import Plotly's JSON encoder

# Sample data for Guest Demographics Insights
data = {
    'guest_id': range(1, 101),  # 100 elements
    'age': ([20, 25, 30, 35, 40, 45, 50, 55, 60]*11 + [65, 70])[:100],  # Truncate to 100 elements
    'nationality': (['USA', 'Canada', 'UK', 'Germany', 'France', 'Australia', 'Japan', 'China', 'India']*11 + ['Brazil', 'South Africa'])[:100],  # Truncate to 100 elements
    'reason_for_travel': (['Leisure', 'Business', 'Leisure', 'Business', 'Leisure', 'Business', 'Leisure', 'Business', 'Leisure']*11 + ['Business', 'Leisure'])[:100],  # Truncate to 100 elements
    'quarter': (['Q1', 'Q2', 'Q3', 'Q4']*25 + ['Q1'])[:100]  # Truncate to 100 elements
}

# Create DataFrame
df = pd.DataFrame(data)

# Pie Chart: Distribution of Purpose of Visit
fig_pie = px.pie(df, names='reason_for_travel', title="Purpose of Visit Distribution")
pie_json = json.dumps(fig_pie.to_plotly_json(), cls=PlotlyJSONEncoder)

# Bar Graph: Age Distribution by Quarter
fig_bar_age = px.bar(df, x='quarter', y='age', title="Age Distribution by Quarter", labels={'age': 'Age'})
bar_age_json = json.dumps(fig_bar_age.to_plotly_json(), cls=PlotlyJSONEncoder)

# Bar Graph: Nationality Distribution
fig_bar_nationality = px.bar(df, x='nationality', title="Nationality Distribution", labels={'nationality': 'Nationality'})
bar_nationality_json = json.dumps(fig_bar_nationality.to_plotly_json(), cls=PlotlyJSONEncoder)

# Save JSON schemas to a file
with open('result.json', 'w') as f:
    json.dump({
        'pie_chart': pie_json,
        'bar_chart_age': bar_age_json,
        'bar_chart_nationality': bar_nationality_json
    }, f, cls=PlotlyJSONEncoder)