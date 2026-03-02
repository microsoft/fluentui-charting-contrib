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
  Body1
} from '@fluentui/react-components';
// @ts-ignore - VegaDeclarativeChart may not be in published nightly types yet
import { VegaDeclarativeChart } from '@fluentui/react-charts';
import VegaChart from './VegaChart';
import { ErrorBoundary } from './ErrorBoundary';
import { getSelection, saveSelection } from './utils';

interface VegaDeclarativeChartExampleProps {
  width?: number;
  height?: number;
  isReversedOrder?: boolean;
}

// Load all vega JSON schemas from the vega_data directory at the repo root
const vegaContext = require.context('../../../../vega_data', false, /\.json$/);
const schemasData = vegaContext.keys()
  .map((fileName: string) => ({
    fileName: fileName.replace('./', ''),
    schema: vegaContext(fileName),
  }))
  .sort((a, b) => a.fileName.localeCompare(b.fileName));

const VegaDeclarativeChartExample: React.FC<VegaDeclarativeChartExampleProps> = ({
  width,
  height,
  isReversedOrder = false,
}) => {
  const savedSchema = getSelection('VegaSchema', schemasData[0]?.fileName || '');
  const savedSchemaData = schemasData.find(s => s.fileName === savedSchema)?.schema || schemasData[0]?.schema || {};

  const [selectedChoice, setSelectedChoice] = React.useState<string>(savedSchema || schemasData[0]?.fileName || '');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedSchema, setSelectedSchema] = React.useState<any>(savedSchemaData);
  const [isJsonInputEnabled, toggleJsonInput] = React.useState<boolean>(false);
  const [jsonInputValue, setJsonInputValue] = React.useState<string>('');

  const theme = React.useMemo(() => getSelection("Theme", "Light"), []);

  const chartSchema = React.useMemo(() => ({ vegaLiteSpec: selectedSchema }), [selectedSchema]);

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
      const saved = getSelection('VegaSchema', schemasData[0]?.fileName || '');
      const schema = schemasData.find(s => s.fileName === saved)?.schema || schemasData[0]?.schema;
      setSelectedChoice(saved);
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

  const chartWidth = Math.min(width ?? 500, 800);
  const chartHeight = height ? height - 40 : 360;

  const fluentVegaChart = React.useMemo(() => (
    <div data-testid="fluent-vega-chart" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Subtitle1 align="center">Fluent VegaDeclarativeChart (react-charts v9)</Subtitle1>
      <br />
      <ErrorBoundary key={`${selectedChoice}_error-boundary-fluent-vega`}>
        <Subtitle2>{chartTitle}</Subtitle2>
        <Divider />
        <br />
        {VegaDeclarativeChart ? (
          <VegaDeclarativeChart
            chartSchema={chartSchema}
            style={{
              width: `${chartWidth}px`,
              height: `${chartHeight}px`,
            }}
          />
        ) : (
          <Body1 style={{ color: '#999', padding: '40px' }}>
            VegaDeclarativeChart not available in this nightly build
          </Body1>
        )}
      </ErrorBoundary>
    </div>
  ), [selectedChoice, chartTitle, chartSchema, chartWidth, chartHeight]);

  const nativeVegaChart = React.useMemo(() => (
    <div data-testid="native-vega-chart" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Divider />
      <br />
      <Subtitle1 align="center">Native Vega-Lite Chart (vega-embed)</Subtitle1>
      <br />
      <ErrorBoundary key={`${selectedChoice}_error-boundary-native-vega`}>
        <Subtitle2>{chartTitle}</Subtitle2>
        <Divider />
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

  const chartsInOrder = React.useMemo(() => {
    return isReversedOrder
      ? [fluentVegaChart, nativeVegaChart]
      : [nativeVegaChart, fluentVegaChart];
  }, [isReversedOrder, fluentVegaChart, nativeVegaChart]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Subtitle1 align="center">Vega-Lite Schema Validation</Subtitle1>
      <Body1 align="center" style={{ marginTop: '4px', color: '#666' }}>
        {schemasData.length} schemas loaded from vega_data/
      </Body1>
      <div style={{ marginTop: '8px' }}>
        <Switch
          checked={isJsonInputEnabled}
          onChange={handleJsonInputSwitchChange}
          label={isJsonInputEnabled ? "JSON input enabled" : "JSON input disabled"}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
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
              {schemasData.map((data) => (
                <Option key={data.fileName} value={data.fileName}>
                  {data.fileName}
                </Option>
              ))}
            </Dropdown>
          </>
        )}
      </div>
      <br />

      {chartsInOrder.map((chart, index) => (
        <div key={`chart-section-${index}`}>
          {chart}
        </div>
      ))}
    </div>
  );
};

export default VegaDeclarativeChartExample;
