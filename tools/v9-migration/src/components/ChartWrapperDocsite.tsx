import {createV8Theme} from "@fluentui/react-migration-v8-v9";
import {ThemeProvider} from '@fluentui/react'
import { ThemeContext_unstable as V9ThemeContext } from "@fluentui/react-shared-contexts";
import React from 'react';
import { Theme, BrandVariants, webLightTheme } from '@fluentui/react-components';
import { DonutChart, IChartProps } from '@fluentui/react-charting';
import * as d3Color from 'd3-color';

const brandInvariant: BrandVariants = { 
  10: "",
  20: "",
  30: "",
  40: "",
  50: "",
  60: "",
  70: "",
  80: "",
  90: "",
  100: "",
  110: "",
  120: "",
  130: "",
  140: "",
  150: "",
  160: ""
};

const data: IChartProps = {
  chartTitle: 'Donut chart fluent v9 example',
  chartData: [
    { legend: 'first', data: 40, color: '#0099BC' },
    { legend: 'second', data: 20, color: '#77004D' },
    { legend: 'third', data: 30, color: '#4f67ed' },
    { legend: 'fourth', data: 10, color: '#ae8c00' },
  ]
};

export function ChartWrapperDocsite() {
    
    let parentV9Theme  = React.useContext(V9ThemeContext) as Theme;
    let v9Theme:Theme=parentV9Theme?parentV9Theme:webLightTheme;
    let backgroundColor = d3Color.hsl(v9Theme.colorNeutralBackground1);
    let foregroundColor = d3Color.hsl(v9Theme.colorNeutralForeground1);
    const myV8Theme=createV8Theme(brandInvariant,v9Theme, backgroundColor.l < foregroundColor.l); // For dark theme background color is darker than foreground color
    return (
    <ThemeProvider theme={myV8Theme}>
        <DonutChart
          data={data}
          innerRadius={35}
          legendProps={{
            allowFocusOnLegends: true,
          }}
          hideLabels={false}
          showLabelsInPercent={true}
          valueInsideDonut={"100"}
        />
    </ThemeProvider>
    );
  }
  