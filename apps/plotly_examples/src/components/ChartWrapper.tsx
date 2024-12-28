import { ThemeProvider, createTheme } from '@fluentui/react'
import React from 'react';
import { paletteSlots, semanticSlots } from "../theming/v8TokenMapping";
import { DeclarativeChartBasicExample } from './DeclarativeChart';

export function ChartWrapper() {
    const v8Theme = createTheme({ palette: paletteSlots, semanticColors: semanticSlots }); //ToDo - Make the slot values dynamic
    return (
    <ThemeProvider theme={v8Theme}>
        <h1>Declarative chart using plotly schema</h1>
        <DeclarativeChartBasicExample />
    </ThemeProvider>
    );
  }
  