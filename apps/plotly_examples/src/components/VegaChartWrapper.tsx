import React from 'react';
import VegaDeclarativeChartExample from './VegaDeclarativeChartExample';

interface VegaChartWrapperProps {
  width: number | undefined;
  height: number | undefined;
  isReversedOrder?: boolean;
}

export function VegaChartWrapper({ width, height, isReversedOrder }: VegaChartWrapperProps) {
  return (
    <div style={{ marginLeft: '25px' }}>
      <VegaDeclarativeChartExample width={width} height={height} isReversedOrder={isReversedOrder} />
    </div>
  );
}
