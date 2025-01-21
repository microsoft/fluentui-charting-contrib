import * as React from 'react';
import { TextField, ITextFieldStyles } from '@fluentui/react/lib/TextField';
import {
  Dropdown,
  Option,
  SelectionEvents,
  OptionOnSelectData,
  Subtitle1,
  Subtitle2,
  Divider
} from '@fluentui/react-components';
import { DeclarativeChart, IDeclarativeChart, Schema } from '@fluentui/react-charting';
import PlotlyChart from './PlotlyChart';
import { ErrorBoundary } from './ErrorBoundary';
import { getSelection, saveSelection } from './utils'

interface IDeclarativeChartProps {
}

// Use require.context to load all JSON files from the split_data folder
const requireContext = require.context('../data', false, /\.json$/);
const schemasData = requireContext.keys().map((fileName: string) => ({
  fileName: fileName.replace('./', ''),
  schema: requireContext(fileName),
}));

const textFieldStyles: Partial<ITextFieldStyles> = { root: { maxWidth: 300 } };

const DeclarativeChartBasicExample: React.FC<IDeclarativeChartProps> = () => {
  const savedOptionStr = getSelection("Schema", '000');
  const savedOption = parseInt(savedOptionStr, 10);
  const savedFileName = `data_${savedOptionStr}.json`;
  const _selectedSchema = schemasData[savedOption]?.schema || {};
  const { selectedLegends } = _selectedSchema as any;
  const [selectedChoice, setSelectedChoice] = React.useState<string>(savedFileName);
  const [selectedSchema, setSelectedSchema] = React.useState<any>(_selectedSchema);
  const [selectedLegendsState, setSelectedLegendsState] = React.useState<string>(JSON.stringify(selectedLegends));
  const declarativeChartRef = React.useRef<IDeclarativeChart>(null);
  let lastKnownValidLegends: string[] | undefined = selectedLegends;

  React.useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);

    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const _onChange = (event: SelectionEvents, data: OptionOnSelectData): void => {
    const selectedChoice = data.optionText!;
    const selectedSchema = schemasData.find((s) => (s.schema as { id: string }).id === data.optionValue!)?.schema;
    saveSelection("Schema", data.optionValue!.toString().padStart(3, '0'));
    const { selectedLegends } = selectedSchema as any;
    setSelectedChoice(selectedChoice);
    setSelectedSchema(selectedSchema);
    setSelectedLegendsState(JSON.stringify(selectedLegends));
  };

  const _onSelectedLegendsEdited = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string,
  ): void => {
    setSelectedLegendsState(newValue ?? '');
  };

  function fileSaver(url: string) {
    const saveLink = document.createElement('a');
    saveLink.href = url;
    saveLink.download = 'converted-image.png';
    document.body.appendChild(saveLink);
    saveLink.click();
    document.body.removeChild(saveLink);
  };

  function htmlEncode(str: string): string {
    if (str !== undefined) {
      return str.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
        return '&#' + i.charCodeAt(0) + ';';
      });
    }
    return '';
  }

  const _handleChartSchemaChanged = (eventData: Schema) => {
    const { selectedLegends } = eventData.plotlySchema;
    setSelectedLegendsState(JSON.stringify(selectedLegends));
  };

  const createDeclarativeChart = (): JSX.Element => {
    const theme = getSelection("Theme", "Light");
    const uniqueKey = `${selectedChoice}_${theme}`;
    const plotlyKey = `plotly_${selectedChoice}_${theme}`;
    const { data, layout } = selectedSchema;
    if (!selectedSchema) {
      return <div>No data available</div>;
    }
    if (selectedLegendsState === '' || selectedLegendsState === undefined) {
      lastKnownValidLegends = undefined;
    } else {
      try {
        lastKnownValidLegends = JSON.parse(selectedLegendsState);
      } catch (error) {
        // Nothing to do here
      }
    }
    const bgcolor = theme === "Dark" ? "rgb(17,17,17)" : "white"; // Full layout for dark mode https://jsfiddle.net/3hfq7ast/
    const fontColor = { "font": { "color": "white" } }
    const layout_with_theme = { ...layout, plot_bgcolor: bgcolor, paper_bgcolor: bgcolor, font: fontColor };
    const plotlySchema = { data, layout: layout_with_theme, selectedLegends: lastKnownValidLegends };
    const inputSchema: Schema = { plotlySchema };
    const chartTitle = typeof layout?.title === 'string' ? htmlEncode(layout.title) : htmlEncode(layout?.title?.text) ?? '';
    return (
      <div key={uniqueKey}>
        <Subtitle1 align="center" style={{ marginLeft: '30%' }}>Declarative chart from fluent</Subtitle1>
        <div style={{ display: 'flex' }}>
          <label> Select a schema:</label>&nbsp;&nbsp;&nbsp;
          <Dropdown
            value={selectedChoice}
            onOptionSelect={_onChange}
          >
            {schemasData.map((data) => (
              <Option value={(data.schema as { id: string }).id}>{data.fileName}</Option>
            ))}
          </Dropdown>
          &nbsp;&nbsp;&nbsp;
        </div>
        <br />
        <button
          onClick={() => {
            declarativeChartRef.current?.exportAsImage().then((imgData: string) => {
              fileSaver(imgData);
            });
          }}
        >
          Download as Image
        </button>
        <div data-testid="chart-container" >
          <br />
          <br />
          <ErrorBoundary>
            <Subtitle2>{chartTitle}</Subtitle2>
            <Divider />
            <br />
            <br />
            <DeclarativeChart
              chartSchema={inputSchema}
              onSchemaChange={_handleChartSchemaChanged}
              componentRef={declarativeChartRef}
            />
          </ErrorBoundary>
        </div>
        <br />
        <TextField
          label="Current Legend selection"
          value={selectedLegendsState}
          onChange={_onSelectedLegendsEdited}
          styles={textFieldStyles}
        />
        <br />
        <div key={plotlyKey}>
          <Divider />
          <br />
          <Subtitle1 align="center" style={{ marginLeft: '30%' }}>Chart from plotly.js</Subtitle1>
          <br />
          <br />
          <ErrorBoundary>
            <PlotlyChart schema={plotlySchema} />
          </ErrorBoundary>
        </div>
      </div>
    );
  };

  return <div>{createDeclarativeChart()}</div>;
}

export default DeclarativeChartBasicExample;
