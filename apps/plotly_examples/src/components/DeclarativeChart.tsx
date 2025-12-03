import * as React from 'react';
import { TextField, ITextFieldStyles } from '@fluentui/react/lib/TextField';
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
  TextareaOnChangeData
} from '@fluentui/react-components';
import { DeclarativeChart, IDeclarativeChart, Schema } from '@fluentui/react-charting';
import PlotlyChart from './PlotlyChart';
import { ErrorBoundary } from './ErrorBoundary';
import { getSelection, saveSelection, SCHEMA_KEY, SCHEMA_KEY_DEFAULT } from './utils';
import aggregatedChartTypes from './aggregated_chart_types.json';
import type { OutputChartType } from '@fluentui/chart-utilities';
import { mapFluentChart } from '@fluentui/chart-utilities';
import { DeclarativeChart as DeclarativeChartV9 } from '@fluentui/react-charts'

interface IDeclarativeChartProps {
  width?: number;
  height?: number;
  isReversedOrder?: boolean;
  isRTL?: boolean;
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
  | 'Table'
  | 'Funnel'
  | 'ScatterPolar'
  | 'Gantt'
  | 'Annotation'
  | 'Others';

type DataType =
  | 'All'
  | 'general'
  | 'largeData'
  | 'localization'
  | 'seval'
  | 'plotly_express_basic'
  | 'plotly_express_detailed'
  | 'plotly_express_colors'
  | 'advanced_scenarios'
  | 'y_as_object'
  | 'annotations';

const dataTypeRanges = {
  'general': [{ min: 1, max: 252 }, { min: 750, max: 758 }, { min: 840, max: 846 }, { min: 848, max: 853 }, { min: 855, max: 856 }, { min: 871, max: 871 }, { min: 893, max: 922 }, {min: 928, max: 944 }, {min: 988, max: 991}],
  'largeData': [{ min: 253, max: 277 }, { min: 303, max: 332 }, { min: 759, max: 759 }, { min: 767, max: 767 }],
  'localization': [{ min: 278, max: 302 }],
  'seval': [{ min: 333, max: 376 }],
  'plotly_express_basic': [{ min: 377, max: 427 }, { min: 760, max: 766 }, {min: 945, max: 957 }, {min: 985, max: 987 }],
  'plotly_express_detailed': [{ min: 428, max: 569 }],
  'plotly_express_colors': [{ min: 570, max: 749 }, { min: 768, max: 787 }],
  'advanced_scenarios': [{ min: 788, max: 839 }, { min: 847, max: 847 }, { min: 854, max: 854 }, { min: 857, max: 870 }, { min: 872, max: 892 }],
  'y_as_object': [{ min: 923, max: 927 }],
  'annotations': [{ min: 966, max: 984}, { min: 992, max: 1005 }],
};

// Use require.context to access all JSON files from the split_data folder without eagerly loading them
const requireContext = require.context('../data', false, /\.json$/);

interface SchemaEntry {
  fileName: string;
  id: number;
}

const CHUNK_SIZE = 250;

const textFieldStyles: Partial<ITextFieldStyles> = { root: { maxWidth: 300 } };

const DeclarativeChartBasicExample: React.FC<IDeclarativeChartProps> = ({ width, height, isReversedOrder = false, isRTL = false }) => {
  const savedOptionStr = getSelection(SCHEMA_KEY, SCHEMA_KEY_DEFAULT);
  const schemaCacheRef = React.useRef<Map<string, Schema | undefined>>(new Map());
  const dropdownButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const [isDropdownOpen, setIsDropdownOpen] = React.useState<boolean>(false);

  const loadSchema = React.useCallback((fileName: string): Schema | undefined => {
    if (!fileName) {
      return undefined;
    }
    const cachedSchema = schemaCacheRef.current.get(fileName);
    if (cachedSchema) {
      return cachedSchema;
    }
    try {
      const schema = requireContext(`./${fileName}`) as Schema;
      schemaCacheRef.current.set(fileName, schema);
      return schema;
    } catch (error) {
      console.error(`Failed to load schema for ${fileName}`, error);
      return undefined;
    }
  }, []);

  const allSchemaEntries = React.useMemo<SchemaEntry[]>(() => {
    return requireContext
      .keys()
      .map((rawFileName: string) => {
        const fileName = rawFileName.replace('./', '');
        const idMatch = fileName.match(/\d+/);
        const id = idMatch ? parseInt(idMatch[0], 10) : 0;
        return { fileName, id };
      })
      .sort((a, b) => (a.id - b.id) || a.fileName.localeCompare(b.fileName));
  }, []);

  const formatSchemaLabel = React.useCallback((entry: SchemaEntry) => {
    const paddedId = entry.id.toString().padStart(4, '0');
    return entry.fileName.replace(/\d+/, paddedId);
  }, []);

  const initialSelection = React.useMemo(() => {
    const savedId = parseInt(savedOptionStr, 10);
    const entry = allSchemaEntries.find((schemaEntry: SchemaEntry) => schemaEntry.id === savedId) ?? allSchemaEntries[0];
    if (!entry) {
      return {
        fileName: '',
        schema: {},
        legendsString: '',
        schemaId: undefined as number | undefined,
      };
    }
    const schema = loadSchema(entry.fileName) ?? {};
    const { selectedLegends } = schema as any;
    return {
      fileName: entry.fileName,
      schema,
      legendsString: selectedLegends ? JSON.stringify(selectedLegends) : '',
      schemaId: entry.id,
    };
  }, [allSchemaEntries, loadSchema, savedOptionStr]);

  const [selectedChoice, setSelectedChoice] = React.useState<string>(initialSelection.fileName);
  const [selectedSchema, setSelectedSchema] = React.useState<any>(initialSelection.schema);
  const [selectedLegendsState, setSelectedLegendsState] = React.useState<string>(initialSelection.legendsString);
  const [selectedPlotTypes, setSelectedPlotTypes] = React.useState<PlotType[]>(getSelection("PlotType_filter", 'All').split(',') as PlotType[]);
  const [selectedDataTypes, setSelectedDataTypes] = React.useState<DataType[]>(getSelection("DataType_filter", 'All').split(',') as DataType[]);
  const [isJsonInputEnabled, toggleJsonInput] = React.useState<boolean>(false);
  const [jsonInputValue, setJsonInputValue] = React.useState<string>('');
  const [visibleCount, setVisibleCount] = React.useState<number>(CHUNK_SIZE);

   const declarativeChartRef = React.useRef<IDeclarativeChart>(null!);
  const declarativeChartV9Ref = React.useRef<IDeclarativeChart>(null!);
  let lastKnownValidLegends: string[] | undefined;
  const [chartRenderKey, setChartRenderKey] = React.useState<number>(0);

  const selectedChoiceDisplay = React.useMemo(() => {
    if (!selectedChoice) {
      return '';
    }
    const entry = allSchemaEntries.find((schemaEntry: SchemaEntry) => schemaEntry.fileName === selectedChoice);
    return entry ? formatSchemaLabel(entry) : selectedChoice;
  }, [allSchemaEntries, formatSchemaLabel, selectedChoice]);

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

  // Force re-render when height or width changes
  React.useEffect(() => {
    setChartRenderKey((prev: number) => prev + 1);
  }, [height, width]);

  // Force chart height after render
  React.useEffect(() => {
    if (!height) return;

    const applyHeightToCharts = () => {
      // Find all chart containers by class names
      const chartRoots = document.querySelectorAll('[class*="chartWrapper"]');
      chartRoots.forEach((root) => {
        if (root) {
          const parent = (root as HTMLElement).parentElement?.parentElement;
          if (parent) {
            parent.style.height = `${height}px`;
            parent.style.minHeight = `${height}px`;
            parent.style.maxHeight = `${height}px`;
          }
        }
      });
    };

    // Apply immediately and after a short delay to catch async renders
    applyHeightToCharts();
    const timeoutId = setTimeout(applyHeightToCharts, 500);

    return () => clearTimeout(timeoutId);
  }, [height, chartRenderKey, isRTL]);

  const updateSelectionFromEntry = React.useCallback((entry: SchemaEntry | undefined, shouldPersist = true) => {
    if (!entry) {
      setSelectedChoice('');
      setSelectedSchema({});
      setSelectedLegendsState('');
      return;
    }
    const schema = loadSchema(entry.fileName) ?? {};
    const { selectedLegends: legendsFromSchema } = schema as any;
    setSelectedChoice(entry.fileName);
    setSelectedSchema(schema);
    setSelectedLegendsState(legendsFromSchema ? JSON.stringify(legendsFromSchema) : '');
    if (shouldPersist) {
  saveSelection(SCHEMA_KEY, entry.id.toString().padStart(4, '0'));
    }
    setChartRenderKey((prev: number) => prev + 1);
  }, [loadSchema]);

  const _onChange = (event: SelectionEvents | null, data: OptionOnSelectData): void => {
    if (!data.optionValue) {
      return;
    }
    const selectedId = parseInt(data.optionValue.toString(), 10);
    const entry = allSchemaEntries.find((schemaEntry: SchemaEntry) => schemaEntry.id === selectedId);
    updateSelectionFromEntry(entry);
  };

  const _onSelectedLegendsEdited = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string,
  ): void => {
    setSelectedLegendsState(newValue ?? '');
  };

  function fileSaver(url: string, name: string) {
    const saveLink = document.createElement('a');
    saveLink.href = url;
    saveLink.download = name;
    document.body.appendChild(saveLink);
    saveLink.click();
    document.body.removeChild(saveLink);
  };

  const _handleChartSchemaChanged = (eventData: Schema) => {
    const { selectedLegends } = eventData.plotlySchema;
    setSelectedLegendsState(JSON.stringify(selectedLegends));
  };

  const aggregatedChartTypeMap = aggregatedChartTypes as Record<string, PlotType | undefined>;

  const filteredSchemaEntries = React.useMemo<SchemaEntry[]>(() => {
    return allSchemaEntries.filter((entry: SchemaEntry) => {
      const schemaId = entry.id;
      const matchesDataType = selectedDataTypes.includes('All') || selectedDataTypes.some((dataType: DataType) => {
        if (dataType === 'All') {
          return true;
        }
        const ranges = dataTypeRanges[dataType as keyof typeof dataTypeRanges];
        return ranges ? ranges.some(range => schemaId >= range.min && schemaId <= range.max) : false;
      });

      if (!matchesDataType) {
        return false;
      }

  const schemaIdKeyFourDigit = schemaId.toString().padStart(4, '0');
  const schemaIdKeyThreeDigit = schemaId.toString().padStart(3, '0');
  const plotType = aggregatedChartTypeMap[schemaIdKeyFourDigit] ?? aggregatedChartTypeMap[schemaIdKeyThreeDigit];
      const matchesPlotType = selectedPlotTypes.includes('All') || (plotType ? selectedPlotTypes.includes(plotType) : false);
      return matchesPlotType;
    });
  }, [allSchemaEntries, aggregatedChartTypeMap, selectedDataTypes, selectedPlotTypes]);

  const visibleSchemaEntries = React.useMemo<SchemaEntry[]>(() => {
    return filteredSchemaEntries.slice(0, visibleCount);
  }, [filteredSchemaEntries, visibleCount]);

  const canLoadMoreSchemas = visibleCount < filteredSchemaEntries.length;

  const loadMoreIfPossible = React.useCallback(() => {
    setVisibleCount((prev: number) => {
      if (prev >= filteredSchemaEntries.length) {
        return prev;
      }
      return Math.min(prev + CHUNK_SIZE, filteredSchemaEntries.length);
    });
  }, [filteredSchemaEntries.length]);

  const ensureSelectionVisibility = React.useCallback((targetChoice: string, entries: SchemaEntry[]) => {
    if (!targetChoice) {
      return;
    }
  const targetIndex = entries.findIndex((entry: SchemaEntry) => entry.fileName === targetChoice);
    if (targetIndex === -1) {
      return;
    }
    const requiredCount = Math.ceil((targetIndex + 1) / CHUNK_SIZE) * CHUNK_SIZE;
    if (requiredCount > visibleCount) {
      setVisibleCount((prev: number) => Math.max(prev, requiredCount));
    }
  }, [visibleCount]);

  const handleSelectPlotTypes = (_event: SelectionEvents, data: OptionOnSelectData) => {
    let newSelectedPlotTypes: PlotType[];
    if (data.optionValue === 'All') {
      newSelectedPlotTypes = ['All'];
    } else {
      newSelectedPlotTypes = selectedPlotTypes.includes(data.optionValue as PlotType)
        ? selectedPlotTypes.filter((type: PlotType) => type !== data.optionValue)
        : [...selectedPlotTypes.filter((type: PlotType) => type !== 'All'), data.optionValue as PlotType];
      if (newSelectedPlotTypes.length === 0) {
        newSelectedPlotTypes = ['All'];
      }
    }
    setSelectedPlotTypes(newSelectedPlotTypes as PlotType[]);
    saveSelection("PlotType_filter", newSelectedPlotTypes.join(','));
    setVisibleCount(CHUNK_SIZE);
  }

  const handleSelectDataTypes = (_event: SelectionEvents, data: OptionOnSelectData) => {
    let newSelectedDataTypes: DataType[];
    if (data.optionValue === 'All') {
      newSelectedDataTypes = ['All'];
    } else {
      newSelectedDataTypes = selectedDataTypes.includes(data.optionValue as DataType)
        ? selectedDataTypes.filter((type: DataType) => type !== data.optionValue)
        : [...selectedDataTypes.filter((type: DataType) => type !== 'All'), data.optionValue as DataType];
      if (newSelectedDataTypes.length === 0) {
        newSelectedDataTypes = ['All'];
      }
    }
    setSelectedDataTypes(newSelectedDataTypes as DataType[]);
    saveSelection("DataType_filter", newSelectedDataTypes.join(','));
    setVisibleCount(CHUNK_SIZE);
  }

  const handleJsonInputSwitchChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const checked = ev.currentTarget.checked;
    toggleJsonInput(checked);
    if (checked) {
      setIsDropdownOpen(false);
    }
    if (checked) {
      setSelectedChoice('input_json');
      handleJsonInputChange(null, { value: jsonInputValue });
    } else {
      const paddedSchemaId = getSelection(SCHEMA_KEY, SCHEMA_KEY_DEFAULT);
      const schemaId = parseInt(paddedSchemaId, 10);
      const entry = allSchemaEntries.find((schemaEntry: SchemaEntry) => schemaEntry.id === schemaId) ?? filteredSchemaEntries[0];
      updateSelectionFromEntry(entry);
    }
  }

  const handleJsonInputChange = (ev: React.ChangeEvent<HTMLTextAreaElement> | null, data: TextareaOnChangeData) => {
    setJsonInputValue(data.value);
    try {
      const schema = JSON.parse(data.value);
      setSelectedSchema(schema);
    } catch (error) {
      setSelectedSchema({});
    }
  };

  // Render V8 Chart section
  const renderV8Chart = (chartType: OutputChartType, inputSchema: Schema, chartTitle: string) => (
    <>
      <Subtitle1 align="center" style={{ marginLeft: '30%' }}>Declarative chart from fluent v8</Subtitle1>
      <br/>
      <button
        onClick={() => {
          const start = performance.now();
          declarativeChartRef.current?.exportAsImage().then((imgData: string) => {
            const end = performance.now();
            console.log(`V8 exportAsImage took ${(end - start).toFixed(2)} ms`);
            fileSaver(imgData, 'v8-chart-image.png');
          });
        }}
      >
        Download V8 Chart as Image
      </button>
      <div data-testid="chart-container">
        <br />
        <br />
        <ErrorBoundary key={`${selectedChoice}_error-boundary-v8`}>
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
            <div style={{ color: 'red', height: '180px', textAlign: 'center', paddingTop: '80px' }}>
              {`${selectedChoice}: Error: ${chartType.errorMessage}`}
            </div>
          )}
        </ErrorBoundary>
      </div>
      <br />
      <TextField
        label="Current Legend selection"
        value={selectedLegendsState}
        onChange={_onSelectedLegendsEdited}
        styles={textFieldStyles}
        disabled={isJsonInputEnabled}
      />
    </>
  );

  // Render V9 Chart section
  const renderV9Chart = (chartType: OutputChartType, inputSchema: Schema, chartTitle: string) => (
    <>
      <Subtitle2>Charts v9</Subtitle2>
      <br/>
      <button
        onClick={() => {
          const start = performance.now();
          declarativeChartV9Ref.current?.exportAsImage().then((imgData: string) => {
            const end = performance.now();
            console.log(`V9 exportAsImage took ${(end - start).toFixed(2)} ms`);
            fileSaver(imgData, 'v9-chart-image.png');
          });
        }}
      >
        Download V9 Chart as Image
      </button>
      <div data-testid="chart-container-v9">
        <br />
        <br />
        <ErrorBoundary key={`${selectedChoice}_error-boundary-v9`}>
          <Subtitle2>{chartTitle}</Subtitle2>
          <Divider />
          <br />
          <br />
          {chartType.isValid ? (
            <DeclarativeChartV9
              chartSchema={inputSchema}
              onSchemaChange={_handleChartSchemaChanged}
              componentRef={declarativeChartV9Ref}
            />
          ) : (
            <div style={{ color: 'red', height: '180px', textAlign: 'center', paddingTop: '80px' }}>
              {`${selectedChoice}: Error: ${chartType.errorMessage}`}
            </div>
          )}
        </ErrorBoundary>
      </div>
      <br />
    </>
  );

  // Render Plotly Chart section
  const renderPlotlyChart = (plotlySchemaCopy: any, plotlyKey: string) => (
    <div key={plotlyKey} data-testid="plotly-plot">
      <Divider />
      <br />
      <Subtitle1 align="center" style={{ marginLeft: '30%' }}>Chart from plotly.js</Subtitle1>
      <br />
      <br />
      <ErrorBoundary>
        <PlotlyChart 
          schema={plotlySchemaCopy} 
          width={width} 
          height={height ? height - 40 : undefined}
        />
      </ErrorBoundary>
    </div>
  );

  // Get chart components in the correct order
  const getChartsInOrder = (chartType: OutputChartType, inputSchema: Schema, chartTitle: string, plotlySchemaCopy: any, plotlyKey: string) => {
    const v8Chart = renderV8Chart(chartType, inputSchema, chartTitle);
    const v9Chart = renderV9Chart(chartType, inputSchema, chartTitle);
    const plotlyChart = renderPlotlyChart(plotlySchemaCopy, plotlyKey);

    if (isReversedOrder) {
      // Reversed order: V9 → Plotly → V8
      return [v9Chart, plotlyChart, v8Chart];
    } else {
      // Default order: V8 → Plotly → V9
      return [v8Chart, plotlyChart, v9Chart];
    }
  };

   const createDeclarativeChart = (): React.JSX.Element => {
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
    const plotlySchemaCopy = JSON.parse(JSON.stringify(plotlySchema)); // Deep copy to avoid mutation
    const chartType: OutputChartType = mapFluentChart(plotlySchema);
    const inputSchema: Schema = { plotlySchema };
    const chartTitle = typeof layout?.title === 'string' ? layout.title : layout?.title?.text ?? '';
    return (
      <div key={uniqueKey}>
        <Subtitle1 align="center" style={{ marginLeft: '30%' }}>Declarative chart from fluent</Subtitle1>
        <div>
          <Switch
            checked={isJsonInputEnabled}
            onChange={handleJsonInputSwitchChange}
            label={isJsonInputEnabled ? "JSON input enabled" : "JSON input disabled"}
          />
        </div>
        <div style={{ display: 'flex' }}>
          {isJsonInputEnabled ? (
            <Field label="Input JSON">
              <Textarea resize='both' value={jsonInputValue} onChange={handleJsonInputChange} />
            </Field>
          ) : (
            <>
              <label> Select a schema:</label>&nbsp;&nbsp;&nbsp;
              <Dropdown
                ref={dropdownButtonRef}
                value={selectedChoiceDisplay}
                onOptionSelect={_onChange}
                onOpenChange={(_event, data) => setIsDropdownOpen(data.open)}
              >
                {visibleSchemaEntries
                  .map((entry: SchemaEntry) => (
                    <Option key={entry.fileName} value={entry.id.toString()}>
                      {formatSchemaLabel(entry)}
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
                <Option value="Table">Table</Option>
                <Option value="Funnel">Funnel</Option>
                <Option value="ScatterPolar">ScatterPolar</Option>
                <Option value="Gantt">Gantt</Option>
                <Option value="Line - Log">Line - Log</Option>
                <Option value="Scatter - Log">Scatter - Log</Option>
                <Option value="HorizontalBarWithAxis - Log">HorizontalBarWithAxis - Log</Option>
                <Option value="VerticalBar - Log">VerticalBar - Log</Option>
                <Option value="Histogram - Log">Histogram - Log</Option>
                <Option value="Annotation">Annotation</Option>
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
                <Option value='advanced_scenarios'>advanced_scenarios</Option>
                <Option value='y_as_object'>y_as_object</Option>
                <Option value='annotations'>annotations</Option>
              </Dropdown>
            </>
          )}
        </div>
        <br />
        
        {/* Render charts in the specified order */}
        {getChartsInOrder(chartType, inputSchema, chartTitle, plotlySchemaCopy, plotlyKey).map((chart, index) => (
          <div key={`chart-section-${index}`}>
            {chart}
          </div>
        ))}
      </div>
    );
  };

  React.useEffect(() => {
    if (isJsonInputEnabled) {
      return;
    }
    if (selectedChoice && filteredSchemaEntries.some((entry: SchemaEntry) => entry.fileName === selectedChoice)) {
      ensureSelectionVisibility(selectedChoice, filteredSchemaEntries);
      return;
    }
    if (filteredSchemaEntries.length > 0) {
      updateSelectionFromEntry(filteredSchemaEntries[0]);
    } else {
      updateSelectionFromEntry(undefined);
    }
  }, [ensureSelectionVisibility, filteredSchemaEntries, isJsonInputEnabled, selectedChoice, updateSelectionFromEntry]);

  React.useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }
    const dropdownButton = dropdownButtonRef.current;
    if (!dropdownButton) {
      return;
    }
    const listboxId = dropdownButton.getAttribute('aria-controls');
    if (!listboxId) {
      return;
    }

    let listbox: HTMLElement | null = null;
    let rafHandle = 0;

    const handleScroll = () => {
      if (!listbox || !canLoadMoreSchemas) {
        return;
      }
      const threshold = listbox.scrollHeight - listbox.clientHeight - 8;
      if (listbox.scrollTop >= threshold) {
        loadMoreIfPossible();
      }
    };

    const attachListener = () => {
      listbox = document.getElementById(listboxId);
      if (!listbox) {
        rafHandle = requestAnimationFrame(attachListener);
        return;
      }
      listbox.addEventListener('scroll', handleScroll);
    };

    attachListener();

    return () => {
      if (rafHandle) {
        cancelAnimationFrame(rafHandle);
      }
      if (listbox) {
        listbox.removeEventListener('scroll', handleScroll);
      }
    };
  }, [canLoadMoreSchemas, isDropdownOpen, loadMoreIfPossible]);

  React.useEffect(() => {
    setVisibleCount((prev: number) => {
      if (filteredSchemaEntries.length === 0) {
        return CHUNK_SIZE;
      }
      const maxVisible = Math.max(CHUNK_SIZE, filteredSchemaEntries.length);
      if (prev > maxVisible) {
        return maxVisible;
      }
      return prev;
    });
  }, [filteredSchemaEntries.length]);

  return <div>{createDeclarativeChart()}</div>;
}

export default DeclarativeChartBasicExample;
