import * as React from 'react';
import {
  Dropdown,
  Option,
  SelectionEvents,
  OptionOnSelectData,
  Subtitle1,
  Subtitle2,
  Divider,
  Textarea,
  Field,
  Switch,
  TextareaOnChangeData,
  Link
} from '@fluentui/react-components';
import { VegaDeclarativeChart } from '@fluentui/react-charts';
import VegaChart from './VegaChart';
import { ErrorBoundary } from './ErrorBoundary';
import { getSelection, saveSelection } from './utils';

interface VegaDeclarativeChartExampleProps {
  width?: number;
  height?: number;
  isReversedOrder?: boolean;
  isRTL?: boolean;
}

// Use require.context to load all JSON files from both vega and vega_converted folders
const vegaContext = require.context('../data/vega', false, /\.json$/);
const vegaConvertedContext = require.context('../data/vega_converted', false, /\.json$/);

const vegaSchemas = vegaContext.keys().map((fileName: string) => ({
  fileName: fileName.replace('./', ''),
  schema: vegaContext(fileName),
  source: 'vega' as const
}));

const convertedSchemas = vegaConvertedContext.keys().map((fileName: string) => ({
  fileName: fileName.replace('./', ''),
  schema: vegaConvertedContext(fileName),
  source: 'converted' as const
}));

const schemasData = [...vegaSchemas, ...convertedSchemas];

const VegaDeclarativeChartExample: React.FC<VegaDeclarativeChartExampleProps> = ({
  width,
  height,
  isReversedOrder = false,
  isRTL = false
}) => {
  const savedSchema = getSelection('VegaSchema', schemasData[0]?.fileName || '');
  const savedSchemaData = schemasData.find(s => s.fileName === savedSchema)?.schema || schemasData[0]?.schema || {};

  const [selectedChoice, setSelectedChoice] = React.useState<string>(savedSchema || schemasData[0]?.fileName || '');
  const [selectedSchema, setSelectedSchema] = React.useState<any>(savedSchemaData);
  const [isJsonInputEnabled, toggleJsonInput] = React.useState<boolean>(false);
  const [jsonInputValue, setJsonInputValue] = React.useState<string>('');

  // Memoize theme to prevent re-reads on every render
  const theme = React.useMemo(() => getSelection("Theme", "Light"), []);

  // Memoize chart schema for Fluent VegaDeclarativeChart
  const chartSchema = React.useMemo(() => ({ vegaLiteSpec: selectedSchema }), [selectedSchema]);

  // Memoize chart title
  const chartTitle = React.useMemo(() => {
    return typeof selectedSchema?.title === 'string'
      ? selectedSchema.title
      : selectedSchema?.title?.text ?? '';
  }, [selectedSchema]);

  const handleSchemaChange = (_event: SelectionEvents, data: OptionOnSelectData): void => {
    const schema = schemasData.find(s => s.fileName === data.optionText)?.schema;
    setSelectedChoice(data.optionText || '');
    setSelectedSchema(schema);
    saveSelection('VegaSchema', data.optionText || '');
  };

  const handleJsonInputSwitchChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const checked = ev.currentTarget.checked;
    toggleJsonInput(checked);
    if (checked) {
      setSelectedChoice('input_json');
      handleJsonInputChange(null, { value: jsonInputValue });
    } else {
      const savedSchema = getSelection('VegaSchema', schemasData[0]?.fileName || '');
      const schema = schemasData.find(s => s.fileName === savedSchema)?.schema || schemasData[0]?.schema;
      setSelectedChoice(savedSchema);
      setSelectedSchema(schema);
    }
  };

  const handleJsonInputChange = (ev: React.ChangeEvent<HTMLTextAreaElement> | null, data: TextareaOnChangeData) => {
    setJsonInputValue(data.value);
    try {
      const schema = JSON.parse(data.value);
      setSelectedSchema(schema);
    } catch (error) {
      setSelectedSchema({});
    }
  };

  // Default chart width when dimension sliders are disabled
  const chartWidth = width ?? 650;
  const chartHeight = height ? height - 40 : 360;

  // Memoize the Fluent chart to prevent re-renders
  const fluentVegaChart = React.useMemo(() => (
    <div data-testid="fluent-vega-chart" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Subtitle1 align="center">Fluent VegaDeclarativeChart (react-charts v9)</Subtitle1>
      <br />
      <br />
      <ErrorBoundary key={`${selectedChoice}_error-boundary-fluent-vega`}>
        <Subtitle2>{chartTitle}</Subtitle2>
        <Divider />
        <br />
        <br />
        <VegaDeclarativeChart
          chartSchema={chartSchema}
          style={{
            width: `${chartWidth}px`,
            height: `${chartHeight}px`,
          }}
        />
      </ErrorBoundary>
    </div>
  ), [selectedChoice, chartTitle, chartSchema, chartWidth, chartHeight]);

  // Memoize the native chart to prevent re-renders
  const nativeVegaChart = React.useMemo(() => (
    <div data-testid="native-vega-chart" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Divider />
      <br />
      <Subtitle1 align="center">Native Vega-Lite Chart (vega-embed)</Subtitle1>
      <br />
      <br />
      <ErrorBoundary key={`${selectedChoice}_error-boundary-native-vega`}>
        <Subtitle2>{chartTitle}</Subtitle2>
        <Divider />
        <br />
        <br />
        <VegaChart
          spec={selectedSchema}
          width={chartWidth}
          height={chartHeight}
          theme={theme.toLowerCase() as 'light' | 'dark'}
        />
      </ErrorBoundary>
    </div>
  ), [selectedChoice, chartTitle, selectedSchema, chartWidth, chartHeight, theme]);

  // Get chart components in the correct order
  const chartsInOrder = React.useMemo(() => {
    if (isReversedOrder) {
      // Reversed order: Native → Fluent
      return [nativeVegaChart, fluentVegaChart];
    } else {
      // Default order: Fluent → Native
      return [fluentVegaChart, nativeVegaChart];
    }
  }, [isReversedOrder, fluentVegaChart, nativeVegaChart]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ marginBottom: '10px' }}>
        <Link href="/">Go to Plotly Charts</Link>
      </div>
      <Subtitle1 align="center">Vega-Lite Chart Comparison</Subtitle1>
      <div>
        <Switch
          checked={isJsonInputEnabled}
          onChange={handleJsonInputSwitchChange}
          label={isJsonInputEnabled ? "JSON input enabled" : "JSON input disabled"}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {isJsonInputEnabled ? (
          <Field label="Input Vega-Lite JSON">
            <Textarea resize='both' value={jsonInputValue} onChange={handleJsonInputChange} />
          </Field>
        ) : (
          <>
            <label>Select a schema:</label>&nbsp;&nbsp;&nbsp;
            <Dropdown
              value={selectedChoice}
              onOptionSelect={handleSchemaChange}
            >
              {schemasData
                .sort((a, b) => a.fileName.localeCompare(b.fileName))
                .map((data) => (
                  <Option key={data.fileName} value={data.fileName}>
                    {data.fileName}
                  </Option>
                ))}
            </Dropdown>
          </>
        )}
      </div>
      <br />

      {/* Render charts in the specified order */}
      {chartsInOrder.map((chart, index) => (
        <div key={`chart-section-${index}`}>
          {chart}
        </div>
      ))}
    </div>
  );
};

export default VegaDeclarativeChartExample;
