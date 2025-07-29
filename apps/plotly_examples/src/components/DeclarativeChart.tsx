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
  | 'Scattergl'
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
  | 'lazy_loaded';

const dataTypeRanges = {
  'general': [{ min: 1, max: 252 }, {min: 750, max: 758 }, {min: 840, max: 846 }, {min: 848, max: 853}, {min: 855, max: 856}, {min: 871, max: 871}, {min: 893, max: 912}],
  'largeData': [{ min: 253, max: 277 }, { min: 303, max: 332 }, { min: 759, max: 759 }, {min: 767, max: 767}],
  'localization': [{ min: 278, max: 302 }],
  'seval': [{ min: 333, max: 376 }],
  'plotly_express_basic': [{ min: 377, max: 427 }, {min: 760, max: 766}],
  'plotly_express_detailed': [{ min: 428, max: 569 }],
  'plotly_express_colors': [{ min: 570, max: 749 }, { min: 768, max: 787 }],
  'advanced_scenarios': [{min: 788, max: 839}, {min: 847, max: 847}, {min: 854, max: 854}, {min: 857, max: 870}, {min: 872, max: 892}],
  'lazy_loaded': [{ min: 913, max: 950 }]
};

// Generate file list for eager loading based on dataTypeRanges (excluding lazy_loaded)
const generateEagerFileList = (): string[] => {
  const fileList: string[] = [];
  const eagerDataTypes = Object.keys(dataTypeRanges).filter(key => key !== 'lazy_loaded') as (keyof typeof dataTypeRanges)[];
  
  eagerDataTypes.forEach(dataType => {
    const ranges = dataTypeRanges[dataType];
    if (!ranges) return; // Add safety check
    
    ranges.forEach(range => {
      if (range && typeof range.min === 'number' && typeof range.max === 'number') {
        for (let i = range.min; i <= range.max; i++) {
          const fileName = `./data_${i.toString().padStart(3, '0')}.json`;
          if (!fileList.includes(fileName)) {
            fileList.push(fileName);
          }
        }
      }
    });
  });
  
  return fileList.sort();
};

// Use require.context to load files based on the generated list
const requireContext = require.context('../data', false, /\.json$/);
const eagerFileList = generateEagerFileList();
const eagerSchemasData = eagerFileList
  .filter(fileName => {
    try {
      return requireContext.keys().includes(fileName);
    } catch {
      return false;
    }
  })
  .map((fileName: string) => ({
    fileName: fileName.replace('./', ''),
    schema: requireContext(fileName),
  }));

// Create lazy loading map for large files (data_913.json to data_950.json)
const lazyDataCache = new Map<string, any>();
const createLazyLoader = (fileName: string) => ({
  fileName,
  schema: null, // Will be loaded on demand
  isLazy: true,
});

// Create placeholders for lazy-loaded files based on lazy_loaded range
const lazyPlaceholders: any[] = [];
const lazyRanges = dataTypeRanges.lazy_loaded;
if (lazyRanges) {
  lazyRanges.forEach(range => {
    if (range && typeof range.min === 'number' && typeof range.max === 'number') {
      for (let i = range.min; i <= range.max; i++) {
        lazyPlaceholders.push(createLazyLoader(`data_${i.toString().padStart(3, '0')}.json`));
      }
    }
  });
}

// Combine eager and lazy data
const schemasData = [...eagerSchemasData, ...lazyPlaceholders];

// Lazy loading function
const loadLazyData = async (fileName: string): Promise<any> => {
  if (lazyDataCache.has(fileName)) {
    return lazyDataCache.get(fileName);
  }
  
  try {
    const module = await import(`../data/${fileName}`);
    const schema = module.default || module;
    lazyDataCache.set(fileName, schema);
    return schema;
  } catch (error) {
    console.error(`Failed to load ${fileName}:`, error);
    return null;
  }
};

// Preload first few lazy files for better UX
const preloadInitialLazyData = async () => {
  const lazyRanges = dataTypeRanges.lazy_loaded;
  if (!lazyRanges || lazyRanges.length === 0) return;
  
  const lazyRange = lazyRanges[0]; // Get first range
  if (!lazyRange || typeof lazyRange.min !== 'number' || typeof lazyRange.max !== 'number') return;
  
  const filesToPreload = [];
  for (let i = lazyRange.min; i < Math.min(lazyRange.min + 3, lazyRange.max + 1); i++) {
    filesToPreload.push(`data_${i.toString().padStart(3, '0')}.json`);
  }
  
  for (const fileName of filesToPreload) {
    try {
      await loadLazyData(fileName);
    } catch (error) {
      console.warn(`Failed to preload ${fileName}:`, error);
    }
  }
};

// Start preloading in the background
preloadInitialLazyData();

const textFieldStyles: Partial<ITextFieldStyles> = { root: { maxWidth: 300 } };

const DeclarativeChartBasicExample: React.FC<IDeclarativeChartProps> = () => {
  const savedOptionStr = getSelection(SCHEMA_KEY, SCHEMA_KEY_DEFAULT);
  const savedOption = parseInt(savedOptionStr, 10);
  const savedFileName = `data_${savedOptionStr}.json`;
  
  // Find the saved data item by ID rather than by index
  const savedDataItem = schemasData.find((s) => {
    if ((s as any).isLazy) {
      const fileNumberMatch = s.fileName.match(/\d+/);
      const fileId = fileNumberMatch ? parseInt(fileNumberMatch[0], 10) : 0;
      return fileId === savedOption;
    } else {
      const schemaId = parseInt((s.schema as { id: string }).id, 10);
      return schemaId === savedOption;
    }
  });
  
  const isLazyFile = savedDataItem && (savedDataItem as any).isLazy;
  
  const [isLoading, setIsLoading] = React.useState<boolean>(isLazyFile);
  const [selectedChoice, setSelectedChoice] = React.useState<string>(savedFileName);
  const [selectedSchema, setSelectedSchema] = React.useState<any>(isLazyFile ? {} : (savedDataItem?.schema || {}));
  
  const { selectedLegends } = selectedSchema as any;
  const [selectedLegendsState, setSelectedLegendsState] = React.useState<string>(JSON.stringify(selectedLegends || []));
  const [selectedPlotTypes, setSelectedPlotTypes] = React.useState<PlotType[]>(() => {
    const saved = getSelection("PlotType_filter", 'All');
    return saved ? saved.split(',').filter(Boolean) as PlotType[] : ['All'];
  });
  const [selectedDataTypes, setSelectedDataTypes] = React.useState<DataType[]>(() => {
    const saved = getSelection("DataType_filter", 'All');
    return saved ? saved.split(',').filter(Boolean) as DataType[] : ['All'];
  });
  const [isJsonInputEnabled, toggleJsonInput] = React.useState<boolean>(false);
  const [jsonInputValue, setJsonInputValue] = React.useState<string>('');

  const declarativeChartRef = React.useRef<IDeclarativeChart>(null);
  const declarativeChartV9Ref = React.useRef<IDeclarativeChart>(null);
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

  // Effect to load initial lazy data if needed
  React.useEffect(() => {
    const loadInitialData = async () => {
      if (isLazyFile && savedDataItem) {
        setIsLoading(true);
        try {
          const schema = await loadLazyData(savedFileName);
          if (schema) {
            setSelectedSchema(schema);
            setSelectedLegendsState(JSON.stringify(schema.selectedLegends || []));
          }
        } catch (error) {
          console.error('Failed to load initial lazy data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();
  }, []);

  const _onChange = async (event: SelectionEvents | null, data: OptionOnSelectData): Promise<void> => {
    const selectedChoice = data.optionText!;
    const targetId = data.optionValue!.toString();
    
    // Find the data item by ID
    const selectedDataItem = schemasData.find((s) => {
      if ((s as any).isLazy) {
        // For lazy files, extract ID from filename
        const fileNumberMatch = s.fileName.match(/\d+/);
        const fileId = fileNumberMatch ? fileNumberMatch[0] : '0';
        return fileId === targetId;
      } else {
        // For eager files, use schema.id
        const schemaId = (s.schema as { id: string }).id.toString();
        return schemaId === targetId;
      }
    });
    
    saveSelection(SCHEMA_KEY, targetId.padStart(3, '0'));
    setSelectedChoice(selectedChoice);
    
    if (selectedDataItem && (selectedDataItem as any).isLazy) {
      // Handle lazy loading
      setIsLoading(true);
      try {
        const schema = await loadLazyData(selectedDataItem.fileName);
        if (schema) {
          setSelectedSchema(schema);
          setSelectedLegendsState(JSON.stringify(schema.selectedLegends || []));
        }
      } catch (error) {
        console.error('Failed to load lazy data:', error);
        setSelectedSchema({});
        setSelectedLegendsState('[]');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle eager loaded data
      const selectedSchema = selectedDataItem?.schema || {};
      const { selectedLegends } = selectedSchema as any;
      setSelectedSchema(selectedSchema);
      setSelectedLegendsState(JSON.stringify(selectedLegends || []));
    }
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
        // For lazy loaded data, extract ID from filename
        let schemaId: number;
        if ((data as any).isLazy) {
          const fileNumberMatch = data.fileName.match(/\d+/);
          schemaId = fileNumberMatch ? parseInt(fileNumberMatch[0], 10) : 0;
        } else {
          schemaId = parseInt((data.schema as { id: string }).id, 10);
        }
        
        return selectedDataTypes.includes('All') || selectedDataTypes.some(dataType => {
          if (dataType === 'All') return true;
          const ranges = dataTypeRanges[dataType as keyof typeof dataTypeRanges];
          if (!ranges) return false; // Add null check
          return ranges.some(range => schemaId >= range.min && schemaId <= range.max);
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

  const handleSelectPlotTypes = async (_event: SelectionEvents, data: OptionOnSelectData) => {
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
      
      if ((firstFilteredSchema as any).isLazy) {
        // Handle lazy loading
        setIsLoading(true);
        try {
          const schema = await loadLazyData(firstFilteredSchema.fileName);
          if (schema) {
            setSelectedSchema(schema);
            setSelectedLegendsState(JSON.stringify(schema.selectedLegends || []));
          }
        } catch (error) {
          console.error('Failed to load lazy data:', error);
          setSelectedSchema({});
          setSelectedLegendsState('[]');
        } finally {
          setIsLoading(false);
        }
      } else {
        setSelectedSchema(firstFilteredSchema.schema);
        setSelectedLegendsState(JSON.stringify((firstFilteredSchema.schema as any).selectedLegends || []));
      }
      
      const fileNumberMatch = firstFilteredSchema.fileName.match(/\d+/);
      const num_id = fileNumberMatch ? fileNumberMatch[0] : '0';
      saveSelection(SCHEMA_KEY, num_id.toString().padStart(3, '0'));
    } else {
      setSelectedChoice('');
      setSelectedSchema({});
      setSelectedLegendsState('');
    }
  }

  const handleSelectDataTypes = async (_event: SelectionEvents, data: OptionOnSelectData) => {
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
      
      if ((firstFilteredSchema as any).isLazy) {
        // Handle lazy loading
        setIsLoading(true);
        try {
          const schema = await loadLazyData(firstFilteredSchema.fileName);
          if (schema) {
            setSelectedSchema(schema);
            setSelectedLegendsState(JSON.stringify(schema.selectedLegends || []));
          }
        } catch (error) {
          console.error('Failed to load lazy data:', error);
          setSelectedSchema({});
          setSelectedLegendsState('[]');
        } finally {
          setIsLoading(false);
        }
      } else {
        setSelectedSchema(firstFilteredSchema.schema);
        setSelectedLegendsState(JSON.stringify((firstFilteredSchema.schema as any).selectedLegends || []));
      }
      
      const fileNumberMatch = firstFilteredSchema.fileName.match(/\d+/);
      const num_id = fileNumberMatch ? fileNumberMatch[0] : '0';
      saveSelection(SCHEMA_KEY, num_id.toString().padStart(3, '0'));
    } else {
      setSelectedChoice('');
      setSelectedSchema({});
      setSelectedLegendsState('');
    }
  }
  
  const handleJsonInputSwitchChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const checked = ev.currentTarget.checked;
    toggleJsonInput(checked);
    if(checked) {
      setSelectedChoice('input_json');
      handleJsonInputChange(null, {value: jsonInputValue});
    } else {
      const paddedSchemaId = getSelection(SCHEMA_KEY, SCHEMA_KEY_DEFAULT);
      _onChange(null, {optionText: `data_${paddedSchemaId}.json`, optionValue: (+paddedSchemaId).toString()} as OptionOnSelectData);
    }
  }

  const handleJsonInputChange = (ev:React.ChangeEvent<HTMLTextAreaElement> | null, data:TextareaOnChangeData) => {
    setJsonInputValue(data.value);
    try {
      const schema = JSON.parse(data.value);
      setSelectedSchema(schema);
    } catch (error) {
      setSelectedSchema({});
    }
  };

  const createDeclarativeChart = (): JSX.Element => {
    const theme = getSelection("Theme", "Light");
    const isRTL = getSelection("RTL", "false") === "true";
    const uniqueKey = `${theme}_${isRTL}`;
    const plotlyKey = `plotly_${theme}_${isRTL}`;
    
    // Show loading state for lazy-loaded data
    if (isLoading) {
      return (
        <div style={{ 
          height: '400px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '18px',
          color: '#666'
        }}>
          Loading chart data...
        </div>
      );
    }
    
    const { data, layout } = selectedSchema;
    if (!selectedSchema || Object.keys(selectedSchema).length === 0) {
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
                value={selectedChoice}
                onOptionSelect={_onChange}
              >
                {getFilteredData()
                  .map((data) => {
                    // For lazy loaded data, extract ID from filename
                    let optionValue: string;
                    if ((data as any).isLazy) {
                      const fileNumberMatch = data.fileName.match(/\d+/);
                      optionValue = fileNumberMatch ? fileNumberMatch[0] : '0';
                    } else {
                      optionValue = (data.schema as { id: string }).id;
                    }
                    
                    const displayText = data.fileName;
                    
                    return (
                      <Option key={data.fileName} value={optionValue} text={displayText}>
                        {displayText}
                      </Option>
                    );
                  })}
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
                <Option value="Scattergl">Scattergl</Option>
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
                <Option value='lazy_loaded'>lazy_loaded</Option>
              </Dropdown>
            </>
          )}
        </div>
        <br />
        <button
          onClick={() => {
            const start = performance.now();
            declarativeChartRef.current?.exportAsImage().then((imgData: string) => {
              const end = performance.now();
              console.log(`exportAsImage took ${(end - start).toFixed(2)} ms`);
              fileSaver(imgData);
            });
          }}
        >
          Download as Image
        </button>

        <div data-testid="chart-container" >
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
          disabled={isJsonInputEnabled}
        />
        <br />
        <div key={plotlyKey} data-testid="plotly-plot">
          <Divider />
          <br />
          <Subtitle1 align="center" style={{ marginLeft: '30%' }}>Chart from plotly.js</Subtitle1>
          <br />
          <br />
          <ErrorBoundary>
            <PlotlyChart schema={plotlySchemaCopy} />
          </ErrorBoundary>
        </div>
        <Subtitle2>Charts v9</Subtitle2>
        <div data-testid="chart-container-v9" >
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
              <div style={{ color: 'red', height: '180px', textAlign: 'center', paddingTop: '80px'}}>{ `${selectedChoice}: Error: ${chartType.errorMessage}`}</div>
            )}
          </ErrorBoundary>
        </div>
      </div>
    );
  };

  return <div>{createDeclarativeChart()}</div>;
}

export default DeclarativeChartBasicExample;
