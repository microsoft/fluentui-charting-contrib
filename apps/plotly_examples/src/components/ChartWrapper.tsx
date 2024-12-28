import { ThemeProvider, createTheme } from '@fluentui/react'
import React from 'react';
import { Subtitle1 } from "@fluentui/react-components";
import { paletteSlots, semanticSlots } from "../theming/v8TokenMapping";
import { DeclarativeChartBasicExample } from './DeclarativeChart';

export function ChartWrapper() {
    const v8Theme = createTheme({ palette: paletteSlots, semanticColors: semanticSlots }); //ToDo - Make the slot values dynamic
    return (
    <ThemeProvider theme={v8Theme}>
        <Subtitle1 align="center" style={{marginLeft:'30%'}}>Declarative chart using plotly schema</Subtitle1>
        <DeclarativeChartBasicExample />
    </ThemeProvider>
    );
  }
  