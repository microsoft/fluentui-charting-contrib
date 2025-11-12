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
  
  return (
    <Plot 
      data={data} 
      layout={{
        ...layout,
        height: height ? height - 40 : layout.height,
        width: width || layout.width,
        autosize: true
      }}
      style={{ 
        width: '100%', 
        height: height ? `${height - 40}px` : '460px'
      }}
      config={{ responsive: true }}
      useResizeHandler={true}
    />
  );
}