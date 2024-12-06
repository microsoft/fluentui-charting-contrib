import * as React from 'react';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { DeclarativeChart, DeclarativeChartProps, Schema } from '@fluentui/react-charting';
import schemasData from '../data/parsed_data.json'; // Import the JSON data

interface IDeclarativeChartState {
  selectedChoice: string;
}

const options: IDropdownOption[] = schemasData.map((schema) => {
  const id = schema.id.toString() || 'unknown';
  return {
    key: id,
    text: schema.layout?.title || 'unknown',
  };
});

const dropdownStyles = { dropdown: { width: 200 } };

export class DeclarativeChartBasicExample extends React.Component<{}, IDeclarativeChartState> {
  constructor(props: DeclarativeChartProps) {
    super(props);
    this.state = {
      selectedChoice: schemasData[0]?.id.toString() || 'unknown', // Set the first schema as the default choice if available
    };
  }

  public render(): JSX.Element {
    return <div>{this._createDeclarativeChart()}</div>;
  }

  private _onChange = (ev: any, option?: IDropdownOption): void => {
    this.setState({ selectedChoice: option?.key as string });
  };

  private _getSchemaByKey(key: string): any {
    const schema = schemasData.find((x: any) => x.id.toString() === key);
    return schema ? schema : null;
  }

  private _createDeclarativeChart(): JSX.Element {
    const selectedPlotlySchema = this._getSchemaByKey(this.state.selectedChoice);
    if (!selectedPlotlySchema) {
      return <div>No data available</div>;
    }
    const inputSchema: Schema = { plotlySchema: selectedPlotlySchema };
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
        <h2>{this.state.selectedChoice}. {selectedPlotlySchema.layout.title}</h2>
        <br />
        <DeclarativeChart chartSchema={inputSchema} />
      </>
    );
  }
}