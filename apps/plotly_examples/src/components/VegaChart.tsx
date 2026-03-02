import * as React from 'react';
import embed, { Result } from 'vega-embed';

interface VegaChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spec: any;
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
}

function VegaChartInner({ spec, width, height, theme = 'light' }: VegaChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewRef = React.useRef<Result | null>(null);
  const lastSpecRef = React.useRef<string>('');
  const lastThemeRef = React.useRef<string>('');

  const specString = React.useMemo(() => JSON.stringify(spec), [spec]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || !spec) return;

    const specChanged = lastSpecRef.current !== specString;
    const themeChanged = lastThemeRef.current !== theme;

    if (!specChanged && !themeChanged && viewRef.current) {
      const view = viewRef.current.view;
      if (width) view.width(width);
      if (height) view.height(height);
      view.runAsync();
      return;
    }

    lastSpecRef.current = specString;
    lastThemeRef.current = theme;

    let isCancelled = false;

    if (viewRef.current) {
      viewRef.current.finalize();
      viewRef.current = null;
    }

    const specWithDimensions = {
      ...spec,
      ...(width && { width }),
      ...(height && { height }),
      autosize: { type: 'fit', contains: 'padding' },
    };

    const embedOptions = {
      actions: false,
      renderer: 'svg' as const,
      config: theme === 'dark' ? {
        background: 'rgb(17,17,17)',
        title: { color: 'white' },
        axis: {
          labelColor: 'white',
          titleColor: 'white',
          gridColor: '#444'
        },
        legend: { labelColor: 'white', titleColor: 'white' }
      } : undefined
    };

    embed(container, specWithDimensions, embedOptions)
      .then((result) => {
        if (!isCancelled) {
          viewRef.current = result;
        } else {
          result.finalize();
        }
      })
      .catch((err: Error) => {
        if (!isCancelled) {
          console.error('Vega embed error:', err);
        }
      });

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specString, width, height, theme]);

  React.useEffect(() => {
    return () => {
      if (viewRef.current) {
        viewRef.current.finalize();
        viewRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        height: height ? `${height}px` : '360px',
        width: width ? `${width}px` : '500px',
        overflow: 'hidden'
      }}
    />
  );
}

const VegaChart = React.memo(VegaChartInner, (prevProps, nextProps) => {
  return (
    JSON.stringify(prevProps.spec) === JSON.stringify(nextProps.spec) &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.theme === nextProps.theme
  );
});

export default VegaChart;
