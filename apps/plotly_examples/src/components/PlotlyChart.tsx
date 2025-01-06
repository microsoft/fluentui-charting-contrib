import Plotly from "plotly.js";
import createPlotlyComponent from "react-plotly.js/factory";
const Plot = createPlotlyComponent(Plotly);

export default function PlotlyChart(schema: any) {
  const { data, layout } = schema.schema;
  return <Plot data={data} layout={layout} />;
}