import { ThemeProvider, createTheme } from '@fluentui/react'
import React from 'react';
import { paletteSlots, semanticSlots } from "../theming/v8TokenMapping";
import DeclarativeChartBasicExample from './DeclarativeChart';

export function ChartWrapper() {
    const v8Theme = createTheme({ palette: paletteSlots, semanticColors: semanticSlots }); //ToDo - Make the slot values dynamic
    return (
    <ThemeProvider theme={v8Theme}>
        <div style={{marginLeft: '25px'}}>
            <DeclarativeChartBasicExample/>
        </div>
    </ThemeProvider>
    );
  }
  