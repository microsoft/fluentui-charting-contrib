# React Chart Application

This project is a React application that utilizes the `@fluentui/react-charting` package to render various plotly schema datasets.

## Project Structure

```
plotly_examples
├── public
│   ├── index.html          # Main HTML file for the React application
├── src
│   ├── components
│   │   └── DeclarativeChart.tsx  # Component for rendering charts
│   ├── data
│   │   └── parsed_data.json       # JSON data for charts
│   ├── App.tsx                # Main application component
│   ├── index.tsx              # Entry point of the application
├── package.json               # npm configuration file
├── tsconfig.json              # TypeScript configuration file
└── README.md                  # Documentation for the project
```

## Setup Instructions

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd plotly_examples
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Run the application**:
   ```
   npm start
   ```

4. **Open your browser** and navigate to `http://localhost:3000` to view the application.

## Usage

The application displays charts based on the data defined in `src/data/parsed_data.json`. The `DeclarativeChart` component in `src/components/DeclarativeChart.tsx` processes this data and renders it using the Fluent UI Charting library.

## Developing with local version of react-charting package
1. Navigate to the local setup of `fluentui\packages\charts\react-charting`
2. Run `yarn link`
3. Navigate to `fluentui-charting-contrib\apps\plotly_examples` (this repo).
4. Run `yarn link @fluentui/react-charting`
5. Navigate back to `fluentui`
6. Delete `node_modules\react` and `node_modules\react-dom`
7. Run `npm link ..\fluentui-charting-contrib\apps\plotly_examples\node_modules\react --legacy-peer-deps` as per your path.
 Ignore any EINTEGRITY errors in this step. 
8. Run `npm link ..\fluentui-charting-contrib\apps\plotly_examples\node_modules\react-dom --legacy-peer-deps` as per your path.
Ignore any EINTEGRITY errors in this step. 
The local charting version is now linked.
You can develop the charts, debug and validate using the playwright tests locally.

## Steps to run functions for generating large data and locale based data in generate_plotly_schema.py

**Large data generation**
First run the functions **generate_visualization_scenarios()** and then **generate_visualization_schemas()**.
Then run **generate_detailed_visualization_schemas()** to get large data.

**Locale based data generation**
First run the function **generate_visualization_scenarios()**. Then run **generate_locale_visualization_schemas()**.

## Data set number mapping

**253 - 277** - Large Dataset
**278 - 302** - Locale based Dataset

## Map data to the chart types

This function **get_chart_type_from_image()** generates mapping of plotly chart data to the chart types available in fluent charts. Before running this, generate screenshots by running Playwright tests by changing the **getByTestId** in DeclarativeChart.spec.ts to **plotly-plot** which will take screenshots of the plotly charts only. These are then mapped to the charts available in our fluent charting library using the above function.
