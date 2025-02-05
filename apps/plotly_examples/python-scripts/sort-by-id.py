import json

with open('aggregated_chart_types.json', 'r') as file:
    data = json.load(file)

sorted_data = {key: data[key] for key in sorted(data.keys(), key=lambda x: int(x))}

with open('aggregated_chart_types_sorted.json', 'w') as file:
    json.dump(sorted_data, file, indent=2)