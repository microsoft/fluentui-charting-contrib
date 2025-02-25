import { ThemeProvider, createTheme } from '@fluentui/react'
import React from 'react';
import { paletteSlots, semanticSlots } from "../theming/v8TokenMapping";
import DeclarativeChartBasicExample from './DeclarativeChart';

interface ChartWrapperProps {
    width: number;
}

export function ChartWrapper({ width }: ChartWrapperProps) {
    const v8Theme = createTheme({ palette: paletteSlots, semanticColors: semanticSlots }); //ToDo - Make the slot values dynamic
    return (
        <ThemeProvider theme={v8Theme}>
            <div style={{ marginLeft: '25px', width: width }}>
                <DeclarativeChartBasicExample />
            </div>
        </ThemeProvider>
    );
}
  