import * as React from 'react';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { DeclarativeChart, DeclarativeChartProps, Schema } from '@fluentui/react-charting';

interface IDeclarativeChartState {
  selectedChoice: string;
  selectedSchema: any;
  schemasData: any[];
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
  constructor(props: DeclarativeChartProps) {
    super(props);
    this.state = {
      selectedChoice: (schemasData[0].schema as { id: string }).id || 'unknown', // Set the first file as the default choice if available
      selectedSchema: schemasData[0]?.schema || null,
      schemasData: schemasData,
    };
  }

  private _onChange = (ev: any, option?: IDropdownOption): void => {
    const selectedChoice = option?.key as string;
    const selectedSchema = this.state.schemasData.find((data) => (data.schema as { id: string }).id === selectedChoice)?.schema;
    this.setState({ selectedChoice, selectedSchema });
  };

  private _createDeclarativeChart(): JSX.Element {
    const { selectedSchema } = this.state;
    if (!selectedSchema) {
      return <div>No data available</div>;
    }
    const inputSchema: Schema = { plotlySchema: selectedSchema };
    console.log(inputSchema);
    return (
      <>
        <Dropdown
          label="Select a schema"
          options={options}
          onChange={this._onChange}
          selectedKey={this.state.selectedChoice}
          styles={dropdownStyles}
        />
        <br />
        <h2>{this.state.selectedChoice}. {selectedSchema.layout.title}</h2>
        <br />
        <DeclarativeChart chartSchema={inputSchema} />
      </>
    );
  }

  public render(): JSX.Element {
    return <div>{this._createDeclarativeChart()}</div>;
  }
}
