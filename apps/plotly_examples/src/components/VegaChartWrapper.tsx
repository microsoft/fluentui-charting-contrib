import { ThemeProvider, createTheme } from '@fluentui/react';
import React from 'react';
import { paletteSlots, semanticSlots } from '../theming/v8TokenMapping';
import VegaDeclarativeChartExample from './VegaDeclarativeChartExample';

interface VegaChartWrapperProps {
  width: number | undefined;
  height: number | undefined;
  isReversedOrder?: boolean;
  isRTL?: boolean;
}

export function VegaChartWrapper({ width, height, isReversedOrder, isRTL }: VegaChartWrapperProps) {
  const v8Theme = createTheme({ palette: paletteSlots, semanticColors: semanticSlots });
  return (
    <ThemeProvider theme={v8Theme}>
      <VegaDeclarativeChartExample
        width={width}
        height={height}
        isReversedOrder={isReversedOrder}
        isRTL={isRTL}
      />
    </ThemeProvider>
  );
}
