import * as React from 'react';
// @ts-ignore - vega-embed types are bundled but TS may not resolve them correctly
import embed from 'vega-embed';

interface VegaChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spec: any;
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
}

interface VegaResult {
  view: {
    width: (w?: number) => number | unknown;
    height: (h?: number) => number | unknown;
    resize: () => Promise<unknown>;
    runAsync: () => Promise<unknown>;
  };
  finalize: () => void;
}

function VegaChartInner({ spec, width, height, theme = 'light' }: VegaChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewRef = React.useRef<VegaResult | null>(null);
  const lastSpecRef = React.useRef<string>('');
  const lastThemeRef = React.useRef<string>('');

  // Memoize spec string to avoid unnecessary re-renders
  const specString = React.useMemo(() => JSON.stringify(spec), [spec]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || !spec) return;

    // Only re-embed if spec or theme changed, not for dimension changes
    const specChanged = lastSpecRef.current !== specString;
    const themeChanged = lastThemeRef.current !== theme;

    if (!specChanged && !themeChanged && viewRef.current) {
      // Just update dimensions on the existing view
      const view = viewRef.current.view;
      if (width) view.width(width);
      if (height) view.height(height);
      view.runAsync();
      return;
    }

    lastSpecRef.current = specString;
    lastThemeRef.current = theme;

    let isCancelled = false;

    // Clean up previous view if it exists
    if (viewRef.current) {
      viewRef.current.finalize();
      viewRef.current = null;
    }

    // Merge width/height into spec and disable auto-sizing
    const specWithDimensions = {
      ...spec,
      ...(width && { width }),
      ...(height && { height }),
      autosize: { type: 'fit', contains: 'padding' },
    };

    // Configure theme-based background and text colors
    const embedOptions = {
      actions: false, // Hide export/source buttons
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
      .then((result: VegaResult) => {
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

  // Cleanup on unmount
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
        width: width ? `${width}px` : '650px',
        overflow: 'visible'
      }}
    />
  );
}

// Memoize to prevent re-renders when parent re-renders with same props
const VegaChart = React.memo(VegaChartInner, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these actually changed
  return (
    JSON.stringify(prevProps.spec) === JSON.stringify(nextProps.spec) &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.theme === nextProps.theme
  );
});

export default VegaChart;
