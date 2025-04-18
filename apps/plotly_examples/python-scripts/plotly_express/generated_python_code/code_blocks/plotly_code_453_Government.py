```python
import plotly.express as px
import json

# Mock data
data = {
    "date": ["2023-01-01", "2023-02-01", "2023-03-01", "2023-04-01", "2023-05-01", "2023-06-01", "2023-07-01", "2023-08-01", "2023-09-01", "2023-10-01"],
    "engagement_level": [120, 135, 180, 150, 160, 170, 190, 210, 230, 220],
    "positive_sentiment": [60, 75, 90, 80, 85, 95, 100, 110, 120, 115],
    "negative_sentiment": [20, 15, 25, 30, 25, 20, 30, 35, 40, 45],
    "neutral_sentiment": [40, 45, 65, 40, 50, 55, 60, 65, 70, 60],
    "age_group": ["18-25", "26-35", "36-45", "46-60", "60+"],
    "age_group_count": [50, 100, 200, 100, 50],
    "policy_areas": ["Healthcare", "Education", "Infrastructure", "Economy", "Environment"],
    "responses": [300, 250, 200, 350, 220]
}

# Line Chart: Engagement levels over time
fig1 = px.line(x=data["date"], y=data["engagement_level"], labels={'x': 'Date', 'y': 'Engagement Level'}, title="Citizen Engagement Level Over Time")
fig1_json = fig1.to_json()

# Bar Chart: Sentiment analysis over time
fig2 = px.bar(data, x="date", y=["positive_sentiment", "negative_sentiment", "neutral_sentiment"], title="Sentiment Analysis Over Time", labels={'value': 'Sentiment Count', 'date': 'Date'}, barmode='group')
fig2_json = fig2.to_json()

# Pie Chart: Demographic participation by age group
fig3 = px.pie(values=data["age_group_count"], names=data["age_group"], title="Demographic Participation by Age Group")
fig3_json = fig3.to_json()

# Save JSON schemas to file
with open('plotly_json_schemas.json', 'w') as f:
    json.dump({'fig1': fig1_json, 'fig2': fig2_json, 'fig3': fig3_json}, f)
```