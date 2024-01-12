import * as React from 'react';
import { AreaChart, DataVizPalette, ILineChartDataPoint } from '@fluentui/react-charting';

interface IACLargeDataExampleState {
  width: number;
  height: number;
}

export class App extends React.Component<{}, IACLargeDataExampleState> {
  constructor(props = {}) {
    super(props);
    this.state = {
      width: 700,
      height: 300,
    };
  }

  public render(): JSX.Element {
    return <div>{this._basicExample()}</div>;
  }

  private _getdata2 = (): ILineChartDataPoint[] => {
    const data: ILineChartDataPoint[] = [];
    //const startDate = new Date('2020-03-01T00:00:00.000Z').getTime();

    for (let i = 0; i < 30000; i++) {
      //const newX = startDate + i * 3600000; // 3600000 milliseconds = 1 hour
      data.push({ x: i, y: this._getY(i + 1) });
    }

    return data;
  };

  private _getY = (i: number) => {
    let res: number = 0;
    const newN = i % 1000;
    if (newN < 500) {
      res = newN * newN;
    } else {
      res = 1000000 - newN * newN;
    }

    return res;
  };

  private _basicExample(): JSX.Element {
    const chartPoints = [
      {
        data: this._getdata2(),
        color: DataVizPalette.color11,
        legend: 'legend1',
      },
    ];

    const chartData = {
      chartTitle: 'Area chart Thirty thousand example',
      lineChartData: chartPoints,
    };
    const rootStyle = { width: `${this.state.width}px`, height: `${this.state.height}px` };

    return (
      <>
        <div style={rootStyle}>
          <AreaChart
            height={this.state.height}
            width={this.state.width}
            data={chartData}
            hideLegend={true}
            legendsOverflowText={'Overflow Items'}
            // legendProps={{
            //   allowFocusOnLegends: true,
            
           // enableReflow={true}
            enablePerfOptimization={true}
          
            optimizeLargeData={true}

          />
        </div>
      </>
    );
  }
}
