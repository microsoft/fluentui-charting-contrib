import {  myCustomTheme, myVariant } from './theme';
import {createV8Theme, white} from "@fluentui/react-migration-v8-v9";
import { VerticalBarChartBasicExample } from './VerticalBarChartBasicExample';
import {ThemeProvider} from '@fluentui/react'
import { DonutChartDynamicExample } from './DonutChartDynamicExample';
import { ThemeContext_unstable as V9ThemeContext } from "@fluentui/react-shared-contexts";
import React from 'react';
import { Theme,webDarkTheme,webLightTheme } from '@fluentui/react-components';
import { LineChartBasicExample } from './LineChartBasicExample';
import { HorizontalBarChartBasicExample } from './HorizontalBarChart.Basic.Example';
import { HeatMapChartBasicExample } from './HeatMapChartBasic.Example';
import * as d3Color from 'd3-color';


export function ChartWrapper() {
    
    let parentV9Theme  = React.useContext(V9ThemeContext) as Theme;
    let v9Theme:Theme=parentV9Theme?parentV9Theme:webLightTheme;
    let backgroundColor = d3Color.hsl(v9Theme.colorNeutralBackground1);
    let foregroundColor = d3Color.hsl(v9Theme.colorNeutralForeground1);
    const myV8Theme=createV8Theme(myVariant,v9Theme, backgroundColor.l < foregroundColor.l); // For dark theme background color is darker than foreground color
    return (
    <ThemeProvider theme={myV8Theme}>
    <div style={{marginLeft: '50px'}}>
      <VerticalBarChartBasicExample/>
      <DonutChartDynamicExample/>
      <LineChartBasicExample/>
      <HorizontalBarChartBasicExample/>
      <HeatMapChartBasicExample/>
    </div>
    </ThemeProvider>
    );
  }
  