import * as React from 'react';
import { TextField, ITextFieldStyles } from '@fluentui/react/lib/TextField';
import { 
  Dropdown,
  Option,
  SelectionEvents,
  OptionOnSelectData,
  Subtitle2
} from '@fluentui/react-components';
import { DeclarativeChart, DeclarativeChartProps, IDeclarativeChart, Schema } from '@fluentui/react-charting';
import PlotlyChart from './PlotlyChart';

interface IErrorBoundaryProps {
  children: React.ReactNode;
}

interface IErrorBoundaryState {
  hasError: boolean;
  error: string;
}

class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  public static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: `${error.message} ${error.stack}` };
  }

  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  public render() {
    if (this.state.hasError) {
      return <h1>${this.state.error}</h1>;
    }

    return this.props.children;
  }
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

const dropdownStyles = { dropdown: { width: 200 } };

const textFieldStyles: Partial<ITextFieldStyles> = { root: { maxWidth: 300 } };

export class DeclarativeChartBasicExample extends React.Component<{}, IDeclarativeChartState> {
  private _declarativeChartRef: React.RefObject<IDeclarativeChart>;
  private _lastKnownValidLegends: string[] | undefined;

  constructor(props: DeclarativeChartProps) {
    super(props);
    const selectedSchema = schemasData[0]?.schema || {};
    const { selectedLegends } = selectedSchema as any;
    this.state = {
      selectedChoice: (schemasData[0].fileName) || 'unknown', // Set the first file as the default choice if available
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

    const uniqueKey = `${this.state.selectedChoice}`;
    const plotlyKey = `plotly_${this.state.selectedChoice}`;
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
    const plotlySchema = { data, layout, selectedLegends: this._lastKnownValidLegends };
    const inputSchema: Schema = { plotlySchema };
    return (
      <>
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
          <Subtitle2>{selectedSchema.layout.title}</Subtitle2>
          <br />
          <br />
          <ErrorBoundary>
            <DeclarativeChart
              key={uniqueKey}
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
        <PlotlyChart/>
      </>
    );
  }

  public render(): JSX.Element {
    return <div>{this._createDeclarativeChart()}</div>;
  }
}
