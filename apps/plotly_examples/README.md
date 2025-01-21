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

5. **Steps to run functions for generating large data and locale based data in generate_plotly_schema.py**

**Large data generation**
First run the functions **generate_visualization_scenarios()** and then **generate_visualization_schemas()**.
Then run **generate_detailed_visualization_schemas()** to get large data.

**Locale based data generation**
First run the function **generate_visualization_scenarios()**. Then run **generate_locale_visualization_schemas()**.

6. **Data set number mapping**

**253 - 277** - Large Dataset
**278 - 302** - Locale based Dataset
