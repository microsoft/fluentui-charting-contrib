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
import { getSelection, saveSelection } from './utils';
import aggregatedChartTypes from './aggregated_chart_types.json';
import type { OutputChartType } from '@fluentui/chart-utilities';
import { mapFluentChart } from '@fluentui/chart-utilities';

interface IDeclarativeChartProps {
}


type PlotType =
  | 'All'
  | 'Area'
  | 'Line'
  | 'Donut'
  | 'HorizontalBarWithAxis'
  | 'VerticalBar'
  | 'VerticalStackedBar'
  | 'GroupedVerticalBar'
  | 'Gauge'
  | 'Pie'
  | 'Sankey'
  | 'Heatmap'
  | 'Histogram'
  | 'Scatter'
  | 'Others';

type DataType =
  | 'All'
  | 'general'
  | 'largeData'
  | 'localization'
  | 'seval'
  | 'plotly_express_basic'
  | 'plotly_express_detailed'
  | 'plotly_express_colors';

const dataTypeRanges = {
  'general': [{ min: 1, max: 252 }, {min: 750, max: 758 }],
  'largeData': [{ min: 253, max: 277 }, { min: 303, max: 332 }, { min: 759, max: 759 }, {min: 767, max: 767}],
  'localization': [{ min: 278, max: 302 }],
  'seval': [{ min: 333, max: 376 }],
  'plotly_express_basic': [{ min: 377, max: 427 }, {min: 760, max: 766}],
  'plotly_express_detailed': [{ min: 428, max: 569 }],
  'plotly_express_colors': [{ min: 570, max: 749 }],
};

// Use require.context to load all JSON files from the split_data folder
const requireContext = require.context('../data', false, /\.json$/);
const schemasData = requireContext.keys().map((fileName: string) => ({
  fileName: fileName.replace('./', ''),
  schema: requireContext(fileName),
}));

const textFieldStyles: Partial<ITextFieldStyles> = { root: { maxWidth: 300 } };

const DeclarativeChartBasicExample: React.FC<IDeclarativeChartProps> = () => {
  const savedOptionStr = getSelection("Schema", '001');
  const savedOption = parseInt(savedOptionStr, 10) - 1; // To handle 0 based index
  const savedFileName = `data_${savedOptionStr}.json`;
  const _selectedSchema = schemasData[savedOption]?.schema || {};

  const { selectedLegends } = _selectedSchema as any;
  const [selectedChoice, setSelectedChoice] = React.useState<string>(savedFileName);
  const [selectedSchema, setSelectedSchema] = React.useState<any>(_selectedSchema);
  const [selectedLegendsState, setSelectedLegendsState] = React.useState<string>(JSON.stringify(selectedLegends));
  const [selectedPlotTypes, setSelectedPlotTypes] = React.useState<PlotType[]>(getSelection("PlotType_filter", 'All').split(',') as PlotType[]);
  const [selectedDataTypes, setSelectedDataTypes] = React.useState<DataType[]>(getSelection("DataType_filter", 'All').split(',') as DataType[]);

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

  const _handleChartSchemaChanged = (eventData: Schema) => {
    const { selectedLegends } = eventData.plotlySchema;
    setSelectedLegendsState(JSON.stringify(selectedLegends));
  };

  const getFilteredData = () => {
    const filteredDataItems = schemasData
      .filter((data) => {
        const schemaId = parseInt((data.schema as { id: string }).id, 10);
        return selectedDataTypes.includes('All') || selectedDataTypes.some(dataType => {
          if (dataType === 'All') return true;
          return dataTypeRanges[dataType].some(range => schemaId >= range.min && schemaId <= range.max);
        });
      })
      .filter((data) => {
        const fileName = data.fileName;
        const fileNumberMatch = fileName.match(/\d+/);
        const fileNumber = fileNumberMatch ? fileNumberMatch[0] : '000';
        const plotType = aggregatedChartTypes[fileNumber as keyof typeof aggregatedChartTypes];
        return selectedPlotTypes.includes('All') || selectedPlotTypes.includes(plotType as PlotType);
      });
    return filteredDataItems;
  }

  const handleSelectPlotTypes = (_event: SelectionEvents, data: OptionOnSelectData) => {
    let newSelectedPlotTypes: PlotType[];
    if (data.optionValue === 'All') {
      newSelectedPlotTypes = ['All'];
    } else {
      newSelectedPlotTypes = selectedPlotTypes.includes(data.optionValue as PlotType)
        ? selectedPlotTypes.filter(type => type !== data.optionValue)
        : [...selectedPlotTypes.filter(type => type !== 'All'), data.optionValue as PlotType];
      if (newSelectedPlotTypes.length === 0) {
        newSelectedPlotTypes = ['All'];
      }
    }
    setSelectedPlotTypes(newSelectedPlotTypes as PlotType[]);
    saveSelection("PlotType_filter", newSelectedPlotTypes.join(','));
    const filteredSchemas = getFilteredData();
    if (filteredSchemas.length > 0) {
      const firstFilteredSchema = filteredSchemas[0];
      setSelectedChoice(firstFilteredSchema.fileName);
      setSelectedSchema(firstFilteredSchema.schema);
      setSelectedLegendsState(JSON.stringify((firstFilteredSchema.schema as any).selectedLegends));
      const fileNumberMatch = firstFilteredSchema.fileName.match(/\d+/);
      const num_id = fileNumberMatch ? fileNumberMatch[0] : '0';
      saveSelection("Schema", num_id.toString().padStart(3, '0'));
    } else {
      setSelectedChoice('');
      setSelectedSchema({});
      setSelectedLegendsState('');
    }
  }

  const handleSelectDataTypes = (_event: SelectionEvents, data: OptionOnSelectData) => {
    let newSelectedDataTypes: DataType[];
    if (data.optionValue === 'All') {
      newSelectedDataTypes = ['All'];
    } else {
      newSelectedDataTypes = selectedDataTypes.includes(data.optionValue as DataType)
        ? selectedDataTypes.filter(type => type !== data.optionValue)
        : [...selectedDataTypes.filter(type => type !== 'All'), data.optionValue as DataType];
      if (newSelectedDataTypes.length === 0) {
        newSelectedDataTypes = ['All'];
      }
    }
    setSelectedDataTypes(newSelectedDataTypes as DataType[]);
    saveSelection("DataType_filter", newSelectedDataTypes.join(','));
    const filteredSchemas = getFilteredData();
    if (filteredSchemas.length > 0) {
      const firstFilteredSchema = filteredSchemas[0];
      setSelectedChoice(firstFilteredSchema.fileName);
      setSelectedSchema(firstFilteredSchema.schema);
      setSelectedLegendsState(JSON.stringify((firstFilteredSchema.schema as any).selectedLegends));
      const fileNumberMatch = firstFilteredSchema.fileName.match(/\d+/);
      const num_id = fileNumberMatch ? fileNumberMatch[0] : '0';
      saveSelection("Schema", num_id.toString().padStart(3, '0'));
    } else {
      setSelectedChoice('');
      setSelectedSchema({});
      setSelectedLegendsState('');
    }
  }

  const createDeclarativeChart = (): JSX.Element => {
    const theme = getSelection("Theme", "Light");
    const isRTL = getSelection("RTL", "false") === "true";
    const uniqueKey = `${theme}_${isRTL}`;
    const plotlyKey = `plotly_${theme}_${isRTL}`;
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
    const chartType: OutputChartType = mapFluentChart(plotlySchema);
    const inputSchema: Schema = { plotlySchema };
    const chartTitle = typeof layout?.title === 'string' ? layout.title : layout?.title?.text ?? '';
    return (
      <div key={uniqueKey}>
        <Subtitle1 align="center" style={{ marginLeft: '30%' }}>Declarative chart from fluent</Subtitle1>
        <div style={{ display: 'flex' }}>
          <label> Select a schema:</label>&nbsp;&nbsp;&nbsp;
          <Dropdown
            value={selectedChoice}
            onOptionSelect={_onChange}
          >
            {getFilteredData()
              .map((data) => (
                <Option key={data.fileName} value={(data.schema as { id: string }).id}>
                  {data.fileName}
                </Option>
              ))}
          </Dropdown>
          &nbsp;&nbsp;&nbsp;
          <label> Filter by plot type:</label>&nbsp;&nbsp;&nbsp;
          <Dropdown
            value={selectedPlotTypes.join(',')}
            selectedOptions={selectedPlotTypes}
            onOptionSelect={handleSelectPlotTypes}
            multiselect
          >
            <Option value="All">All</Option>
            <Option value="Area">Area</Option>
            <Option value="Line">Line</Option>
            <Option value="Donut">Donut</Option>
            <Option value="HorizontalBarWithAxis">HorizontalBarWithAxis</Option>
            <Option value="VerticalBar">VerticalBar</Option>
            <Option value="VerticalStackedBar">VerticalStackedBar</Option>
            <Option value="GroupedVerticalBar">GroupedVerticalBar</Option>
            <Option value="Gauge">Gauge</Option>
            <Option value="Pie">Pie</Option>
            <Option value="Sankey">Sankey</Option>
            <Option value="Heatmap">Heatmap</Option>
            <Option value="Histogram">Histogram</Option>
            <Option value="Scatter">Scatter</Option>
            <Option value="Others">Others</Option>
          </Dropdown>
          &nbsp;&nbsp;&nbsp;
          <label> Filter by data type:</label>&nbsp;&nbsp;&nbsp;
          <Dropdown
            value={selectedDataTypes.join(',')}
            selectedOptions={selectedDataTypes}
            onOptionSelect={handleSelectDataTypes}
            multiselect
          >
            <Option value='All'>All</Option>
            <Option value='general'>general</Option>
            <Option value='largeData'>largeData</Option>
            <Option value='localization'>localization</Option>
            <Option value='seval'>seval</Option>
            <Option value='plotly_express_basic'>plotly_express_basic</Option>
            <Option value='plotly_express_detailed'>plotly_express_detailed</Option>
            <Option value='plotly_express_colors'>plotly_express_colors</Option>
          </Dropdown>
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
            {chartType.isValid ? (
              <DeclarativeChart
                chartSchema={inputSchema}
                onSchemaChange={_handleChartSchemaChanged}
                componentRef={declarativeChartRef}
              />
            ) : (
              <div style={{ color: 'red', height: '180px', textAlign: 'center', paddingTop: '80px'}}>{ `${selectedChoice}: Error: ${chartType.errorMessage}`}</div>
            )}
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
        <div key={plotlyKey} data-testid="plotly-plot">
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
