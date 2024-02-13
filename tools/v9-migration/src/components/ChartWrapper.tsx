import { chartInvariant } from './theme';
import {createV8Theme, white} from "@fluentui/react-migration-v8-v9";
import { VerticalBarChartBasicExample } from './VerticalBarChartBasicExample';
import {ThemeProvider} from '@fluentui/react'
import { DonutChartDynamicExample } from './DonutChartDynamicExample';
import { ThemeContext_unstable as V9ThemeContext } from "@fluentui/react-shared-contexts";
import React from 'react';
import { Theme, BrandVariants, webDarkTheme,webLightTheme, Divider } from '@fluentui/react-components';
import { LineChartBasicExample } from './LineChartBasicExample';
import { HorizontalBarChartBasicExample } from './HorizontalBarChart.Basic.Example';
import { HeatMapChartBasicExample } from './HeatMapChartBasic.Example';
import { AreaChartBasicExample } from './AreaChart.Basic.Example';
import { LegendBasicExample } from './Legends.Basic.Example';
import { MultiStackedBarChartBasicExample } from './MultiStackedBarChart.Example';
import { VerticalStackedBarChartBasicExample } from './VerticalStackedBarChart.Basic.Example';
import { SankeyChartBasicExample } from './SankeyChart.Basic.Example';
import { SparklineChartBasicExample } from './SparklineChart.Basic.Example';
import { TreeChartThreeLayerExample } from './TreeChart.ThreeLayer.Example';
import { GaugeChartBasicExample } from './GaugeChart.Basic.Example';
import * as d3Color from 'd3-color';
import { VerticalStackedBarChartCustomV9HoverCard } from './VerticalStackedBarChart.CustomV9HoverCard.Example';


export function ChartWrapper() {
    
    let parentV9Theme  = React.useContext(V9ThemeContext) as Theme;
    let v9Theme:Theme=parentV9Theme?parentV9Theme:webLightTheme;
    let backgroundColor = d3Color.hsl(v9Theme.colorNeutralBackground1);
    let foregroundColor = d3Color.hsl(v9Theme.colorNeutralForeground1);
    const myV8Theme=createV8Theme(chartInvariant,v9Theme, backgroundColor.l < foregroundColor.l); // For dark theme background color is darker than foreground color
    return (
    <ThemeProvider theme={myV8Theme}>
    <div style={{marginLeft: '40px', marginRight: '40px'}}>
    <Divider appearance='brand'>Legends</Divider><br/>
      <LegendBasicExample/>
    <Divider appearance='brand'>Vertical Bar Chart</Divider><br/>
      <VerticalBarChartBasicExample/>
      <Divider appearance='brand'> Donut Chart<br/></Divider><br/>
      <DonutChartDynamicExample/>
      <Divider appearance='brand'>Line Chart<br/></Divider><br/>
      <LineChartBasicExample/>
      <Divider appearance='brand'>Horizontal Bar Chart<br/></Divider><br/>
      <HorizontalBarChartBasicExample/>
      <Divider appearance='brand'>HeatMap Chart<br/></Divider><br/>
      <HeatMapChartBasicExample/>
      <Divider appearance='brand'>Area Chart<br/></Divider><br/>
      <AreaChartBasicExample/>
      <Divider appearance='brand'>Multi StackedBar Chart<br/></Divider><br/>
      <MultiStackedBarChartBasicExample/>
      <Divider appearance='brand'>Vertical StackedBar Chart<br/></Divider><br/>
      <VerticalStackedBarChartBasicExample/>
      <Divider appearance='brand'>Sankey Chart<br/></Divider><br/>
      <SankeyChartBasicExample/>
      <Divider appearance='brand'>Tree Chart<br/></Divider><br/>
      <TreeChartThreeLayerExample/>
      <Divider appearance='brand'>Sparkline Chart<br/></Divider><br/>
      <SparklineChartBasicExample/>
      <Divider appearance='brand'>Gauge Chart<br/></Divider><br/>
      <GaugeChartBasicExample/>
      <Divider appearance='brand'>Vertical StackedBar Chart with custom V9 Hover Card<br/></Divider><br/>
      <VerticalStackedBarChartCustomV9HoverCard/>
      <Divider appearance='brand'/><br/>
    </div>
    </ThemeProvider>
    );
  }
  