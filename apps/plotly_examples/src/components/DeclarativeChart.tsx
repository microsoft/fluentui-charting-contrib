import * as React from 'react';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { DeclarativeChart, DeclarativeChartProps, IDeclarativeChart, Schema } from '@fluentui/react-charting';
import { Toggle } from '@fluentui/react/lib/Toggle';

interface IDeclarativeChartState {
  selectedChoice: string;
  selectedSchema: any;
  schemasData: any[];
  preSelectLegends: boolean;
  selectedLegends: string;
}

// Use require.context to load all JSON files from the split_data folder
const requireContext = require.context('../data', false, /\.json$/);
const schemasData = requireContext.keys().map((fileName: string) => ({
  fileName: fileName.replace('./', ''),
  schema: requireContext(fileName),
}));

const options: IDropdownOption[] = schemasData.map((data) => ({
  key: (data.schema as { id: string }).id,
  text: data.fileName,
}));

const dropdownStyles = { dropdown: { width: 200 } };

export class DeclarativeChartBasicExample extends React.Component<{}, IDeclarativeChartState> {
  private _declarativeChartRef: React.RefObject<IDeclarativeChart>;
  constructor(props: DeclarativeChartProps) {
    super(props);
    this.state = {
      selectedChoice: (schemasData[0].schema as { id: string }).id || 'unknown', // Set the first file as the default choice if available
      selectedSchema: schemasData[0]?.schema || null,
      schemasData: schemasData,
      preSelectLegends: false,
      selectedLegends: '',
    };
    this._declarativeChartRef = React.createRef();
  }

  private _onChange = (ev: any, option?: IDropdownOption): void => {
    const selectedChoice = option?.key as string;
    const selectedSchema = this.state.schemasData.find((data) => (data.schema as { id: string }).id === selectedChoice)?.schema;
    this.setState({ selectedChoice, selectedSchema, selectedLegends: '' });
  };

  private _onTogglePreselectLegends = (ev: React.MouseEvent<HTMLElement>, checked?: boolean) => {
    this.setState({ preSelectLegends: checked! });
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
    this.setState({ selectedLegends: selectedLegends.join(', ') });
  };

  private _createDeclarativeChart(): JSX.Element {
    const { selectedSchema } = this.state;
    if (!selectedSchema) {
      return <div>No data available</div>;
    }
    const inputSchema: Schema = { plotlySchema: selectedSchema };
    const uniqueKey = `${this.state.selectedChoice}_${this.state.preSelectLegends}`;
    return (
      <>
        <div style={{ display: 'flex' }}>
          <Dropdown
            label="Select a schema"
            options={options}
            onChange={this._onChange}
            selectedKey={this.state.selectedChoice}
            styles={dropdownStyles}
          />
          &nbsp;&nbsp;&nbsp;
          <Toggle
            label="Pre select legends"
            onText="ON"
            offText="OFF"
            onChange={this._onTogglePreselectLegends}
            checked={this.state.preSelectLegends}
          />
        </div>
        <br />
        <button
          onClick={() => {
            this._declarativeChartRef.current?.exportAsImage().then((imgData: string) => {
              this.fileSaver(imgData);
            });
          }}
        >
          Download
        </button>
        <br />
        <br />
        <h2>{this.state.selectedChoice}. {selectedSchema.layout.title}</h2>
        <br />
        <br />
        <DeclarativeChart
          key={uniqueKey}
          chartSchema={inputSchema}
          onSchemaChange={this._handleChartSchemaChanged}
          componentRef={this._declarativeChartRef}
        />
        <br />
        Legend selection changed : {this.state.selectedLegends}
      </>
    );
  }

  public render(): JSX.Element {
    return <div>{this._createDeclarativeChart()}</div>;
  }
}
