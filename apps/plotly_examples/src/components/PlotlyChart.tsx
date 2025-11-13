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
    <div
      key={`plotly-${width || 'auto'}-${height || 'auto'}`}
      style={{
        height: height ? `${height}px` : '500px',
        width: width ? `${width}px` : '100%',
        overflow: 'visible'
      }}
    >
      <Plot 
        data={data} 
        layout={layout}
        style={{ width: '100%', height: '100%' }}
        config={{ responsive: true }}
      />
    </div>
  );
}