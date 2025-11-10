import Plotly from "plotly.js";
import createPlotlyComponent from "react-plotly.js/factory";
const Plot = createPlotlyComponent(Plotly);

interface PlotlyChartProps {
  schema: any;
  width?: number;
  height?: number;
}

export default function PlotlyChart({ schema, width, height }: PlotlyChartProps) {
  const { data, layout } = schema;
  
  // Update layout with width and height if provided
  const updatedLayout = {
    ...layout,
    ...(width && { width }),
    ...(height && { height }),
    // Ensure autosize is disabled when dimensions are specified
    ...(width || height) && { autosize: false }
  };
  
  return <Plot data={data} layout={updatedLayout} />;
}