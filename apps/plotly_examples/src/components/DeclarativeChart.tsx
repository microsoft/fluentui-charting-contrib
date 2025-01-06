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

interface IDeclarativeChartState {
  selectedChoice: string;
  selectedSchema: any;
  schemasData: any[];
  selectedLegends: string;
}

// Use require.context to load all JSON files from the split_data folder
const requireContext = require.context('../data', false, /\.json$/);
const schemasData = requireContext.keys().map((fileName: string) => ({
  fileName: fileName.replace('./', ''),
  schema: requireContext(fileName),
}));

const textFieldStyles: Partial<ITextFieldStyles> = { root: { maxWidth: 300 } };

export class DeclarativeChartBasicExample extends React.Component<IDeclarativeChartProps, IDeclarativeChartState> {
  private _declarativeChartRef: React.RefObject<IDeclarativeChart>;
  private _lastKnownValidLegends: string[] | undefined;

  constructor(props: IDeclarativeChartProps) {
    super(props);
    const savedOptionStr = getSelection("Schema", '000');
    const savedOption = parseInt(savedOptionStr, 10);
    const savedFileName = `data_${savedOptionStr}.json`;
    const selectedSchema = schemasData[savedOption]?.schema || {};
    const { selectedLegends } = selectedSchema as any;
    this.state = {
      selectedChoice: savedFileName,
      selectedSchema: selectedSchema,
      schemasData: schemasData,
      selectedLegends: JSON.stringify(selectedLegends),
    };

    this._declarativeChartRef = React.createRef();
    this._lastKnownValidLegends = selectedLegends;
  }

  public componentDidMount() {
    document.addEventListener('contextmenu', e => {
      e.preventDefault();
    });
  }

  private _onChange = (event: SelectionEvents, data: OptionOnSelectData): void => {
    const selectedChoice = data.optionText!;
    const selectedSchema = this.state.schemasData.find((s) => (s.schema as { id: string }).id === data.optionValue!)?.schema;
    saveSelection("Schema", data.optionValue!.toString().padStart(3, '0'));
    const { selectedLegends } = selectedSchema as any;
    this.setState({ selectedChoice, selectedSchema, selectedLegends: JSON.stringify(selectedLegends) });
  };

  private _onSelectedLegendsEdited = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string,
  ): void => {
    this.setState({ selectedLegends: newValue ?? '' });
  };

  private fileSaver(url: string) {
    const saveLink = document.createElement('a');
    saveLink.href = url;
    saveLink.download = 'converted-image.png';
    document.body.appendChild(saveLink);
    saveLink.click();
    document.body.removeChild(saveLink);
  }

  private _handleChartSchemaChanged = (eventData: Schema) => {
    const { selectedLegends } = eventData.plotlySchema;
    this.setState({ selectedLegends: JSON.stringify(selectedLegends) });
  };

  private _createDeclarativeChart(): JSX.Element {
    const theme = getSelection("Theme", "Light");
    const uniqueKey = `${this.state.selectedChoice}_${theme}`;
    const plotlyKey = `plotly_${this.state.selectedChoice}_${theme}`;
    const { selectedSchema } = this.state;
    const { data, layout } = selectedSchema;
    if (!selectedSchema) {
      return <div>No data available</div>;
    }
    if (this.state.selectedLegends === '' || this.state.selectedLegends === undefined) {
      this._lastKnownValidLegends = undefined;
    } else {
      try {
        this._lastKnownValidLegends = JSON.parse(this.state.selectedLegends);
      } catch (error) {
        // Nothing to do here
      }
    }
    const bgcolor = theme === "Dark" ? "rgb(17,17,17)" : "white"; // Full layout for dark mode https://jsfiddle.net/3hfq7ast/
    const fontColor = { "font": { "color": "white" } }
    const layout_with_theme = { ...layout, plot_bgcolor: bgcolor, paper_bgcolor: bgcolor, font: fontColor };
    const plotlySchema = { data, layout: layout_with_theme, selectedLegends: this._lastKnownValidLegends };
    const inputSchema: Schema = { plotlySchema };
    return (
      <div key={uniqueKey}>
        <Subtitle1 align="center" style={{ marginLeft: '30%' }}>Declarative chart from fluent</Subtitle1>
        <div style={{ display: 'flex' }}>
          <label> Select a schema:</label>&nbsp;&nbsp;&nbsp;
          <Dropdown
            value={this.state.selectedChoice}
            onOptionSelect={this._onChange}
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
            this._declarativeChartRef.current?.exportAsImage().then((imgData: string) => {
              this.fileSaver(imgData);
            });
          }}
        >
          Download as Image
        </button>
        <div data-testid="chart-container" >
          <br />
          <br />
          <Subtitle2>{typeof selectedSchema.layout.title === 'string' ? selectedSchema.layout.title : typeof selectedSchema.layout.title.text === 'string' ? selectedSchema.layout.title.text : JSON.stringify(selectedSchema.layout.title)}</Subtitle2>
          <br />
          <br />
          <ErrorBoundary>
            <DeclarativeChart
              chartSchema={inputSchema}
              onSchemaChange={this._handleChartSchemaChanged}
              componentRef={this._declarativeChartRef}
            />
          </ErrorBoundary>
        </div>
        <br />
        <TextField
          label="Current Legend selection"
          value={this.state.selectedLegends}
          onChange={this._onSelectedLegendsEdited}
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
  }

  public render(): JSX.Element {
    return <div>{this._createDeclarativeChart()}</div>;
  }
}
